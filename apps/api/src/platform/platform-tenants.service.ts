import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { newId, generateOpaqueToken, hashToken } from '../common/crypto/token.util';
import {
  ALL_TENANT_PERMISSION_KEYS,
  DEFAULT_ROLE_KEYS,
  DEFAULT_ROLE_META,
    FEATURE_CATALOG,
    FUTURE_FEATURE_CATALOG,
    ROLE_PERMISSION_MATRIX,
  type DefaultRoleKey,
} from '../tenants/seed/role-permission.matrix';
import type { CreateTenantDto } from './dto/tenant.dto';
import { ConfigService } from '@nestjs/config';

const TRIAL_DAYS = 60;

@Injectable()
export class PlatformTenantsService implements OnModuleInit {
  private readonly logger = new Logger(PlatformTenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureEntitlementCatalog();
    } catch (err) {
      this.logger.warn(
        `Entitlement catalog seed skipped (DB may be unavailable): ${String(err)}`,
      );
    }
  }

  async listTenants() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });
    return {
      data: tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        legalName: t.legalName,
        displayName: t.displayName,
        status: t.status,
        writeMode: t.writeMode,
        createdAt: t.createdAt,
        subscription: t.subscriptions[0]
          ? {
              status: t.subscriptions[0].status,
              planCode: t.subscriptions[0].plan.code,
              trialEndsAt: t.subscriptions[0].trialEndsAt,
            }
          : null,
      })),
    };
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        branches: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return { data: tenant };
  }

  async provisionTenant(dto: CreateTenantDto, invitedByUserId?: string) {
    const slug = dto.slug.toLowerCase();
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Slug already in use');
    }

    const trialPlan = await this.prisma.plan.findUnique({
      where: { code: 'trial' },
    });
    if (!trialPlan) {
      throw new ConflictException('Trial plan not seeded');
    }

    const now = new Date();
    const trialEnds = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const inviteRaw = generateOpaqueToken(32);
    const inviteExpires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenantId = newId();
      const branchId = newId();
      const subscriptionId = newId();
      const invitationId = newId();

      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          slug,
          legalName: dto.legalName,
          displayName: dto.displayName,
          status: 'trial',
          writeMode: 'full',
          defaultCurrency: dto.defaultCurrency ?? 'EUR',
          timezone: dto.timezone ?? 'UTC',
          onboardingStep: 'welcome',
        },
      });

      await tx.branch.create({
        data: {
          id: branchId,
          tenantId,
          name: 'Main Branch',
          code: 'MAIN',
          isMain: true,
        },
      });

      // Seed permissions + roles for this tenant
      const permissionIds = new Map<string, string>();
      for (const key of ALL_TENANT_PERMISSION_KEYS) {
        const pid = newId();
        await tx.permission.create({
          data: { id: pid, tenantId, key },
        });
        permissionIds.set(key, pid);
      }

      const roleIds = new Map<DefaultRoleKey, string>();
      for (const roleKey of DEFAULT_ROLE_KEYS) {
        const meta = DEFAULT_ROLE_META[roleKey];
        const rid = newId();
        await tx.role.create({
          data: {
            id: rid,
            tenantId,
            key: roleKey,
            name: meta.name,
            isSystem: true,
            isBranchScoped: meta.isBranchScoped,
          },
        });
        roleIds.set(roleKey, rid);

        for (const [permKey, grantedRoles] of Object.entries(
          ROLE_PERMISSION_MATRIX,
        )) {
          if (!grantedRoles.includes(roleKey)) continue;
          const permissionId = permissionIds.get(permKey);
          if (!permissionId) continue;
          await tx.rolePermission.create({
            data: {
              id: newId(),
              roleId: rid,
              permissionId,
            },
          });
        }
      }

      await tx.subscription.create({
        data: {
          id: subscriptionId,
          tenantId,
          planId: trialPlan.id,
          status: 'trial',
          trialStartsAt: now,
          trialEndsAt: trialEnds,
        },
      });

      const ownerRoleId = roleIds.get('owner')!;
      await tx.invitation.create({
        data: {
          id: invitationId,
          tenantId,
          email: dto.ownerEmail.toLowerCase(),
          kind: 'owner',
          status: 'pending',
          roleId: ownerRoleId,
          tokenHash: hashToken(inviteRaw),
          invitedById: invitedByUserId,
          expiresAt: inviteExpires,
        },
      });

      return { tenant, branchId, ownerRoleId, invitationId, inviteRaw };
    });

    const webOrigin =
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
    const inviteUrl = `${webOrigin}/invite/accept?token=${result.inviteRaw}`;

    await this.mail.enqueueInvitationEmail({
      to: dto.ownerEmail.toLowerCase(),
      tenantName: dto.displayName,
      inviteUrl,
      kind: 'owner',
      tenantId: result.tenant.id,
    });

    return {
      data: {
        tenant: {
          id: result.tenant.id,
          slug: result.tenant.slug,
          displayName: result.tenant.displayName,
          status: result.tenant.status,
          writeMode: result.tenant.writeMode,
        },
        invitation: {
          id: result.invitationId,
          email: dto.ownerEmail.toLowerCase(),
          // Exposed once for MVP local testing; remove in production
          token: result.inviteRaw,
          expiresAt: inviteExpires,
        },
      },
    };
  }

  async activate(tenantId: string) {
    return this.setLifecycle(tenantId, {
      status: 'active',
      writeMode: 'full',
    });
  }

  async suspend(tenantId: string) {
    return this.setLifecycle(tenantId, {
      status: 'suspended',
      writeMode: 'blocked',
    });
  }

  async setReadOnly(tenantId: string) {
    return this.setLifecycle(tenantId, {
      status: 'read_only',
      writeMode: 'read_only',
    });
  }

  async extendTrial(tenantId: string, days = 30) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const base = sub.trialEndsAt && sub.trialEndsAt > new Date()
      ? sub.trialEndsAt
      : new Date();
    const trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: sub.id },
        data: { trialEndsAt, status: 'trial' },
      }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'trial', writeMode: 'full' },
      }),
    ]);

    return this.getTenant(tenantId);
  }

  private async setLifecycle(
    tenantId: string,
    data: { status: 'active' | 'suspended' | 'read_only' | 'trial'; writeMode: 'full' | 'read_only' | 'blocked' },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
    return this.getTenant(tenantId);
  }

  /** Seed Trial + Paid plans and feature catalog (idempotent). */
  async ensureEntitlementCatalog() {
    const catalog = [...FEATURE_CATALOG, ...FUTURE_FEATURE_CATALOG];
    for (const f of catalog) {
      const existing = await this.prisma.feature.findUnique({
        where: { key: f.key },
      });
      if (!existing) {
        await this.prisma.feature.create({
          data: { id: newId(), key: f.key, name: f.name },
        });
      }
    }

    const mvpKeys = new Set(FEATURE_CATALOG.map((f) => f.key));
    const mvpFeatures = await this.prisma.feature.findMany({
      where: { key: { in: [...mvpKeys] } },
    });
    for (const planDef of [
      { code: 'trial', name: 'Trial' },
      { code: 'paid', name: 'Paid' },
    ]) {
      let plan = await this.prisma.plan.findUnique({
        where: { code: planDef.code },
      });
      if (!plan) {
        plan = await this.prisma.plan.create({
          data: {
            id: newId(),
            code: planDef.code,
            name: planDef.name,
            description: `${planDef.name} placeholder — no public prices`,
          },
        });
      }
      // Future feature keys must stay off Trial/Paid unless an override is added later
      for (const feature of mvpFeatures) {
        const link = await this.prisma.planFeature.findUnique({
          where: {
            planId_featureId: { planId: plan.id, featureId: feature.id },
          },
        });
        if (!link) {
          await this.prisma.planFeature.create({
            data: {
              id: newId(),
              planId: plan.id,
              featureId: feature.id,
              enabled: true,
            },
          });
        }
      }
    }
  }
}
