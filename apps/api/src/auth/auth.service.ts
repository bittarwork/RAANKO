import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthSurface } from '@raanko/shared';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../common/crypto/password.service';
import {
  generateOpaqueToken,
  hashToken,
  hashUserAgent,
  newId,
} from '../common/crypto/token.util';
import type { AccessTokenPayload } from '../common/guards/auth.guards';
import { extractTenantSlugFromHost } from '../common/guards/auth.guards';
import { REFRESH_COOKIE_NAME } from '../common/types/auth-context';

const ACCESS_TTL = '15m';
const REFRESH_DAYS = 30;
const SESSION_DAYS = 30;

export interface LoginMeta {
  ip?: string;
  userAgent?: string;
  host?: string;
}

export interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Record<string, unknown>;
  permissions: string[];
  tenant?: Record<string, unknown>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  get refreshCookieName(): string {
    return REFRESH_COOKIE_NAME;
  }

  async loginPlatform(
    email: string,
    password: string,
    totpCode: string | undefined,
    meta: LoginMeta,
  ): Promise<TokenPairResult> {
    const user = await this.findUserForLogin(email);
    const ok = user
      ? await this.password.verify(password, user.passwordHash)
      : false;

    if (!user || !ok) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.PLATFORM,
        result: 'failure',
        failureReason: 'invalid_credentials',
        meta,
        userId: user?.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const assignment = await this.prisma.platformRoleAssignment.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!assignment) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.PLATFORM,
        result: 'failure',
        failureReason: 'no_platform_role',
        meta,
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Super Admin 2FA: required in production Beta, or when already enrolled
    const enforcePlatform2fa =
      this.config.get('NODE_ENV') === 'production' ||
      this.config.get('ENFORCE_PLATFORM_2FA') === 'true';
    if (assignment.role === 'super_admin' && (user.totpEnabledAt || enforcePlatform2fa)) {
      if (!totpCode || !user.totpSecretEncrypted) {
        await this.logActivity({
          email,
          authSurface: AuthSurface.PLATFORM,
          result: 'failure',
          failureReason: 'totp_required',
          meta,
          userId: user.id,
        });
        throw new UnauthorizedException({
          message: '2FA required',
          code: 'TOTP_REQUIRED',
        });
      }
      const valid = authenticator.verify({
        token: totpCode,
        secret: user.totpSecretEncrypted,
      });
      if (!valid) {
        await this.logActivity({
          email,
          authSurface: AuthSurface.PLATFORM,
          result: 'failure',
          failureReason: 'totp_invalid',
          meta,
          userId: user.id,
        });
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    await this.logActivity({
      email,
      authSurface: AuthSurface.PLATFORM,
      result: 'success',
      meta,
      userId: user.id,
    });

    return this.issueSession({
      user,
      authSurface: AuthSurface.PLATFORM,
      platformRole: assignment.role,
      meta,
      permissions: this.platformPermissions(assignment.role),
    });
  }

  async loginCompany(
    email: string,
    password: string,
    tenantSlugHint: string | undefined,
    meta: LoginMeta,
  ): Promise<TokenPairResult> {
    const hostname = meta.host?.split(':')[0]?.toLowerCase();
    const customDomain = hostname
      ? await this.prisma.tenantCustomDomain.findFirst({
          where: {
            hostname,
            status: 'verified',
            verifiedAt: { not: null },
          },
        })
      : null;

    const hostSlug = customDomain ? null : extractTenantSlugFromHost(meta.host);
    const slug = customDomain ? null : (hostSlug ?? tenantSlugHint);
    if (!customDomain && !slug) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.findUserForLogin(email);
    const ok = user
      ? await this.password.verify(password, user.passwordHash)
      : false;

    if (!user || !ok) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.COMPANY,
        result: 'failure',
        failureReason: 'invalid_credentials',
        meta,
        userId: user?.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = customDomain
      ? await this.prisma.tenant.findUnique({ where: { id: customDomain.tenantId } })
      : await this.prisma.tenant.findUnique({ where: { slug: slug! } });
    if (!tenant) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.COMPANY,
        result: 'failure',
        failureReason: 'tenant_not_found',
        meta,
        userId: user.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Explicit mismatch between host and body hint → generic failure
    if (!customDomain && hostSlug && tenantSlugHint && hostSlug !== tenantSlugHint) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.COMPANY,
        result: 'failure',
        failureReason: 'tenant_mismatch',
        meta,
        userId: user.id,
        tenantId: tenant.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (tenant.status === 'suspended' || tenant.writeMode === 'blocked') {
      await this.logActivity({
        email,
        authSurface: AuthSurface.COMPANY,
        result: 'failure',
        failureReason: 'tenant_suspended',
        meta,
        userId: user.id,
        tenantId: tenant.id,
      });
      throw new ForbiddenException({
        message: 'Tenant access blocked',
        code: 'TENANT_ACCESS_BLOCKED',
      });
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        userId: user.id,
        tenantId: tenant.id,
        status: 'active',
      },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!membership) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.COMPANY,
        result: 'failure',
        failureReason: 'no_membership',
        meta,
        userId: user.id,
        tenantId: tenant.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.membership.update({
      where: { id: membership.id },
      data: { lastActiveAt: new Date() },
    });

    await this.logActivity({
      email,
      authSurface: AuthSurface.COMPANY,
      result: 'success',
      meta,
      userId: user.id,
      tenantId: tenant.id,
    });

    const permissions = membership.role.rolePermissions.map(
      (rp) => rp.permission.key,
    );

    return this.issueSession({
      user,
      authSurface: AuthSurface.COMPANY,
      tenantId: tenant.id,
      membershipId: membership.id,
      meta,
      permissions,
      tenantSummary: {
        id: tenant.id,
        slug: tenant.slug,
        displayName: tenant.displayName,
        writeMode: tenant.writeMode,
        status: tenant.status,
        primaryColor: tenant.primaryColor,
        logoUrl: tenant.logoUrl,
      },
    });
  }

  async loginPortal(
    email: string,
    password: string,
    tenantSlugHint: string | undefined,
    meta: LoginMeta,
  ): Promise<TokenPairResult> {
    const hostSlug = extractTenantSlugFromHost(meta.host);
    const slug = hostSlug ?? tenantSlugHint;
    if (!slug) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.findUserForLogin(email);
    const ok = user
      ? await this.password.verify(password, user.passwordHash)
      : false;

    if (!user || !ok) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.PORTAL,
        result: 'failure',
        failureReason: 'invalid_credentials',
        meta,
        userId: user?.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const account = await this.prisma.portalAccount.findFirst({
      where: { userId: user.id, tenantId: tenant.id, status: 'active' },
    });
    if (!account) {
      await this.logActivity({
        email,
        authSurface: AuthSurface.PORTAL,
        result: 'failure',
        failureReason: 'no_portal_account',
        meta,
        userId: user.id,
        tenantId: tenant.id,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.logActivity({
      email,
      authSurface: AuthSurface.PORTAL,
      result: 'success',
      meta,
      userId: user.id,
      tenantId: tenant.id,
    });

    return this.issueSession({
      user,
      authSurface: AuthSurface.PORTAL,
      tenantId: tenant.id,
      portalAccountId: account.id,
      meta,
      permissions: [],
      tenantSummary: {
        id: tenant.id,
        slug: tenant.slug,
        displayName: tenant.displayName,
        writeMode: tenant.writeMode,
      },
    });
  }

  async refresh(
    rawRefresh: string | undefined,
    meta: LoginMeta,
  ): Promise<TokenPairResult> {
    if (!rawRefresh) {
      throw new UnauthorizedException('Unauthorized');
    }

    const tokenHash = hashToken(rawRefresh);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true, user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Reuse of a revoked refresh token → revoke entire session family
    if (existing.revokedAt) {
      await this.prisma.session.update({
        where: { id: existing.sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: 'suspicious_reuse',
        },
      });
      await this.prisma.refreshToken.updateMany({
        where: { sessionId: existing.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Unauthorized');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (existing.session.revokedAt) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const permissions = await this.resolvePermissionsForRefresh(existing);

    return this.issueSession({
      user: existing.user,
      authSurface: existing.authSurface as AuthSurface,
      tenantId: existing.tenantId ?? undefined,
      membershipId: existing.membershipId ?? undefined,
      portalAccountId: existing.portalAccountId ?? undefined,
      meta,
      permissions,
      reuseSessionId: existing.sessionId,
      rotatedFromId: existing.id,
    });
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokedReason: 'logout' },
    });
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(
    userId: string,
    surface: AuthSurface,
    membershipId?: string,
    impersonationHeader?: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        totpEnabledAt: true,
      },
    });

    if (surface === AuthSurface.PLATFORM) {
      const assignment = await this.prisma.platformRoleAssignment.findFirst({
        where: { userId, isActive: true },
      });
      return {
        data: {
          user,
          authSurface: surface,
          platformRole: assignment?.role,
          permissions: assignment
            ? this.platformPermissions(assignment.role)
            : [],
        },
      };
    }

    if (surface === AuthSurface.COMPANY && membershipId) {
      const membership = await this.prisma.membership.findFirstOrThrow({
        where: { id: membershipId, userId },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
          tenant: true,
        },
      });
      const impersonation = await this.loadImpersonationBanner(
        impersonationHeader,
        membership.tenant.id,
      );
      return {
        data: {
          user,
          authSurface: surface,
          membershipId: membership.id,
          roleKey: membership.role.key,
          permissions: membership.role.rolePermissions.map(
            (rp) => rp.permission.key,
          ),
          tenant: {
            id: membership.tenant.id,
            slug: membership.tenant.slug,
            displayName: membership.tenant.displayName,
            writeMode: membership.tenant.writeMode,
            status: membership.tenant.status,
            onboardingStep: membership.tenant.onboardingStep,
          },
          impersonation,
        },
      };
    }

    return { data: { user, authSurface: surface } };
  }

  async listMemberships(userId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { userId, status: 'active' },
      include: { tenant: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        tenantSlug: row.tenant.slug,
        tenantName: row.tenant.displayName,
        roleKey: row.role.key,
        status: row.status,
      })),
    };
  }

  async switchTenant(
    authUserId: string,
    sessionId: string,
    membershipId: string,
    meta: LoginMeta,
  ): Promise<TokenPairResult> {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, userId: authUserId, status: 'active' },
      include: {
        tenant: true,
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
        user: true,
      },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: 'MEMBERSHIP_NOT_OWNED',
        message: 'Membership does not belong to the current user',
      });
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        tenantId: membership.tenantId,
        membershipId: membership.id,
        lastSeenAt: new Date(),
      },
    });

    const permissions = membership.role.rolePermissions.map(
      (rp) => rp.permission.key,
    );

    return this.issueSession({
      user: membership.user,
      authSurface: AuthSurface.COMPANY,
      tenantId: membership.tenantId,
      membershipId: membership.id,
      meta,
      permissions,
      reuseSessionId: sessionId,
      tenantSummary: {
        id: membership.tenant.id,
        slug: membership.tenant.slug,
        displayName: membership.tenant.displayName,
        writeMode: membership.tenant.writeMode,
        status: membership.tenant.status,
      },
    });
  }

  private async loadImpersonationBanner(
    sessionId: string | undefined,
    tenantId: string,
  ) {
    if (!sessionId) {
      return { active: false };
    }
    const row = await this.prisma.impersonationSession.findFirst({
      where: {
        id: sessionId,
        tenantId,
        endedAt: null,
      },
    });
    if (!row) {
      return { active: false };
    }
    return {
      active: true,
      sessionId: row.id,
      reason: row.reason,
      startedAt: row.startedAt,
      banner: 'Platform support is viewing this company workspace',
    };
  }

  /**
   * TOTP verify stub — validates code against stored secret when present.
   * Full enrollment flow can be enforced before Beta production.
   */
  async verifyTotpStub(userId: string, code: string): Promise<{ valid: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.totpSecretEncrypted) {
      return { valid: false };
    }
    const valid = authenticator.verify({
      token: code,
      secret: user.totpSecretEncrypted,
    });
    return { valid };
  }

  private async findUserForLogin(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  private async issueSession(params: {
    user: { id: string; email: string; firstName: string | null; lastName: string | null };
    authSurface: AuthSurface;
    tenantId?: string;
    membershipId?: string;
    portalAccountId?: string;
    platformRole?: string;
    meta: LoginMeta;
    permissions: string[];
    tenantSummary?: Record<string, unknown>;
    reuseSessionId?: string;
    rotatedFromId?: string;
  }): Promise<TokenPairResult> {
    const now = new Date();
    const sessionExpires = new Date(
      now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    );
    const refreshExpires = new Date(
      now.getTime() + REFRESH_DAYS * 24 * 60 * 60 * 1000,
    );

    let sessionId = params.reuseSessionId;
    if (!sessionId) {
      sessionId = newId();
      await this.prisma.session.create({
        data: {
          id: sessionId,
          userId: params.user.id,
          authSurface: params.authSurface,
          tenantId: params.tenantId,
          membershipId: params.membershipId,
          portalAccountId: params.portalAccountId,
          ipAddress: params.meta.ip,
          userAgent: params.meta.userAgent,
          expiresAt: sessionExpires,
        },
      });
    } else {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          lastSeenAt: now,
          ...(params.tenantId ? { tenantId: params.tenantId } : {}),
          ...(params.membershipId ? { membershipId: params.membershipId } : {}),
        },
      });
    }

    const rawRefresh = generateOpaqueToken();
    const refreshId = newId();
    await this.prisma.refreshToken.create({
      data: {
        id: refreshId,
        userId: params.user.id,
        sessionId,
        authSurface: params.authSurface,
        tenantId: params.tenantId,
        membershipId: params.membershipId,
        portalAccountId: params.portalAccountId,
        tokenHash: hashToken(rawRefresh),
        expiresAt: refreshExpires,
        rotatedFromId: params.rotatedFromId,
        ipAddress: params.meta.ip,
        userAgentHash: hashUserAgent(params.meta.userAgent) ?? undefined,
      },
    });

    const payload: AccessTokenPayload = {
      sub: params.user.id,
      sid: sessionId,
      surface: params.authSurface,
      email: params.user.email,
      tenantId: params.tenantId,
      membershipId: params.membershipId,
      platformRole: params.platformRole,
      portalAccountId: params.portalAccountId,
    };

    const accessToken = await this.jwt.signAsync(payload, {
        secret:
          this.config.get<string>('JWT_ACCESS_SECRET') ??
          'dev-only-change-me-access-secret-min-32',
      expiresIn: ACCESS_TTL,
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      expiresIn: 15 * 60,
      user: {
        id: params.user.id,
        email: params.user.email,
        firstName: params.user.firstName,
        lastName: params.user.lastName,
      },
      permissions: params.permissions,
      tenant: params.tenantSummary,
    };
  }

  private async resolvePermissionsForRefresh(existing: {
    authSurface: string;
    userId: string;
    membershipId: string | null;
  }): Promise<string[]> {
    if (existing.authSurface === AuthSurface.PLATFORM) {
      const assignment = await this.prisma.platformRoleAssignment.findFirst({
        where: { userId: existing.userId, isActive: true },
      });
      return assignment ? this.platformPermissions(assignment.role) : [];
    }
    if (existing.authSurface === AuthSurface.COMPANY && existing.membershipId) {
      const membership = await this.prisma.membership.findUnique({
        where: { id: existing.membershipId },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });
      return (
        membership?.role.rolePermissions.map((rp) => rp.permission.key) ?? []
      );
    }
    return [];
  }

  private platformPermissions(role: string): string[] {
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

  private async logActivity(params: {
    email: string;
    authSurface: AuthSurface;
    result: 'success' | 'failure';
    failureReason?: string;
    meta: LoginMeta;
    userId?: string;
    tenantId?: string;
  }) {
    await this.prisma.loginActivity.create({
      data: {
        id: newId(),
        email: params.email.toLowerCase(),
        authSurface: params.authSurface,
        result: params.result,
        failureReason: params.failureReason,
        ipAddress: params.meta.ip,
        userAgent: params.meta.userAgent,
        userId: params.userId,
        tenantId: params.tenantId,
      },
    });
  }
}
