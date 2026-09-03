import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthSurface } from '@raanko/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AUTH_CONTEXT_KEY,
  type AuthContext,
  type TenantContext,
} from '../types/auth-context';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  surface: AuthSurface;
  email: string;
  tenantId?: string;
  membershipId?: string;
  platformRole?: string;
  portalAccountId?: string;
}

@Injectable()
export abstract class BaseAuthGuard implements CanActivate {
  constructor(
    protected readonly jwt: JwtService,
    protected readonly config: ConfigService,
    protected readonly prisma: PrismaService,
    protected readonly reflector: Reflector,
    protected readonly expectedSurface: AuthSurface,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string; host?: string };
      [AUTH_CONTEXT_KEY]?: AuthContext;
    }>();

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }

    const token = header.slice(7);
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret:
          this.config.get<string>('JWT_ACCESS_SECRET') ??
          'dev-only-change-me-access-secret-min-32',
      });
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }

    if (payload.surface !== this.expectedSurface) {
      throw new ForbiddenException('Forbidden');
    }

    const session = await this.prisma.session.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    const authContext = await this.buildAuthContext(payload, request.headers.host);
    request[AUTH_CONTEXT_KEY] = authContext;
    return true;
  }

  protected abstract buildAuthContext(
    payload: AccessTokenPayload,
    host?: string,
  ): Promise<AuthContext>;

  protected async loadTenantContext(
    tenantId: string,
  ): Promise<TenantContext> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            plan: { include: { features: { include: { feature: true } } } },
          },
        },
        featureOverrides: { include: { feature: true } },
      },
    });

    const entitlements = new Set<string>();
    const sub = tenant.subscriptions[0];
    if (sub) {
      for (const pf of sub.plan.features) {
        if (pf.enabled) entitlements.add(pf.feature.key);
      }
    }
    for (const ov of tenant.featureOverrides) {
      if (ov.enabled) entitlements.add(ov.feature.key);
      else entitlements.delete(ov.feature.key);
    }

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      writeMode: tenant.writeMode,
      subscriptionStatus: sub?.status ?? 'unknown',
      entitlements,
      displayName: tenant.displayName,
    };
  }
}

@Injectable()
export class PlatformAuthGuard extends BaseAuthGuard {
  constructor(
    jwt: JwtService,
    config: ConfigService,
    prisma: PrismaService,
    reflector: Reflector,
  ) {
    super(jwt, config, prisma, reflector, AuthSurface.PLATFORM);
  }

  protected async buildAuthContext(
    payload: AccessTokenPayload,
  ): Promise<AuthContext> {
    const assignment = await this.prisma.platformRoleAssignment.findFirst({
      where: { userId: payload.sub, isActive: true },
    });
    if (!assignment) {
      throw new ForbiddenException('Forbidden');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      authSurface: AuthSurface.PLATFORM,
      email: payload.email,
      platformRole: assignment.role,
      permissions: new Set(platformPermissionsForRole(assignment.role)),
    };
  }
}

@Injectable()
export class CompanyAuthGuard extends BaseAuthGuard {
  constructor(
    jwt: JwtService,
    config: ConfigService,
    prisma: PrismaService,
    reflector: Reflector,
  ) {
    super(jwt, config, prisma, reflector, AuthSurface.COMPANY);
  }

  protected async buildAuthContext(
    payload: AccessTokenPayload,
    host?: string,
  ): Promise<AuthContext> {
    if (!payload.tenantId || !payload.membershipId) {
      throw new ForbiddenException('Forbidden');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: payload.membershipId,
        userId: payload.sub,
        tenantId: payload.tenantId,
        status: 'active',
      },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
        branchScopes: true,
        tenant: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden');
    }

    // Host slug hint must match membership tenant when subdomain present
    const slugHint = extractTenantSlugFromHost(host);
    if (slugHint && slugHint !== membership.tenant.slug) {
      const hostname = host?.split(':')[0]?.toLowerCase();
      const custom = hostname
        ? await this.prisma.tenantCustomDomain.findFirst({
            where: {
              tenantId: membership.tenantId,
              hostname,
              status: 'verified',
              verifiedAt: { not: null },
            },
          })
        : null;
      if (!custom) {
        throw new ForbiddenException('Forbidden');
      }
    }

    if (
      membership.tenant.status === 'suspended' ||
      membership.tenant.writeMode === 'blocked'
    ) {
      throw new ForbiddenException({
        message: 'Tenant access blocked',
        code: 'TENANT_ACCESS_BLOCKED',
      });
    }

    const permissions = new Set(
      membership.role.rolePermissions.map((rp) => rp.permission.key),
    );

    let branchIds: string[] | null = null;
    if (membership.role.isBranchScoped) {
      const scoped = membership.branchScopes.map((b) => b.branchId);
      if (membership.defaultBranchId && !scoped.includes(membership.defaultBranchId)) {
        scoped.push(membership.defaultBranchId);
      }
      branchIds = scoped;
    }

    const tenant = await this.loadTenantContext(payload.tenantId);

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      authSurface: AuthSurface.COMPANY,
      email: payload.email,
      membershipId: membership.id,
      roleId: membership.roleId,
      roleKey: membership.role.key,
      permissions,
      branchIds,
      tenant,
    };
  }
}

@Injectable()
export class PortalAuthGuard extends BaseAuthGuard {
  constructor(
    jwt: JwtService,
    config: ConfigService,
    prisma: PrismaService,
    reflector: Reflector,
  ) {
    super(jwt, config, prisma, reflector, AuthSurface.PORTAL);
  }

  protected async buildAuthContext(
    payload: AccessTokenPayload,
    host?: string,
  ): Promise<AuthContext> {
    if (!payload.tenantId || !payload.portalAccountId) {
      throw new ForbiddenException('Forbidden');
    }

    const account = await this.prisma.portalAccount.findFirst({
      where: {
        id: payload.portalAccountId,
        userId: payload.sub,
        tenantId: payload.tenantId,
        status: 'active',
      },
      include: { tenant: true },
    });
    if (!account) {
      throw new ForbiddenException('Forbidden');
    }

    const slugHint = extractTenantSlugFromHost(host);
    if (slugHint && slugHint !== account.tenant.slug) {
      throw new ForbiddenException('Forbidden');
    }

    const tenant = await this.loadTenantContext(payload.tenantId);

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      authSurface: AuthSurface.PORTAL,
      email: payload.email,
      customerId: account.customerId ?? undefined,
      permissions: new Set(),
      tenant,
    };
  }
}

function extractTenantSlugFromHost(host?: string): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0]?.toLowerCase();
  if (!hostname) return null;
  // localhost / admin host → no company slug
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('admin.')
  ) {
    return null;
  }
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0] ?? null;
  }
  // Allow x-tenant-slug header simulation via host like acme.localhost
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0] ?? null;
  }
  return null;
}

function platformPermissionsForRole(role: string): string[] {
  if (role === 'super_admin') {
    return [
      'platform.tenants.view',
      'platform.tenants.create',
      'platform.tenants.update',
      'platform.tenants.suspend',
      'platform.subscriptions.manage',
      'platform.usage.view',
      'platform.support.view',
      'platform.support.manage',
      'platform.audit.view',
      'platform.settings.manage',
      'platform.users.manage',
    ];
  }
  return [
    'platform.tenants.view',
    'platform.support.view',
    'platform.support.manage',
    'platform.audit.view',
  ];
}

export { extractTenantSlugFromHost };

/**
 * Authenticates any surface from the access token, then delegates
 * to the matching surface guard so /auth/me and /auth/logout stay unified.
 */
@Injectable()
export class AnySurfaceAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly platform: PlatformAuthGuard,
    private readonly company: CompanyAuthGuard,
    private readonly portal: PortalAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(header.slice(7), {
        secret:
          this.config.get<string>('JWT_ACCESS_SECRET') ??
          'dev-only-change-me-access-secret-min-32',
      });
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }

    if (payload.surface === AuthSurface.PLATFORM) {
      return this.platform.canActivate(context);
    }
    if (payload.surface === AuthSurface.COMPANY) {
      return this.company.canActivate(context);
    }
    if (payload.surface === AuthSurface.PORTAL) {
      return this.portal.canActivate(context);
    }
    throw new ForbiddenException('Forbidden');
  }
}

