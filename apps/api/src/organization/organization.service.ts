import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../common/crypto/password.service';
import { MailService } from '../mail/mail.service';
import {
  generateOpaqueToken,
  hashToken,
  newId,
} from '../common/crypto/token.util';
import type { AuthContext } from '../common/types/auth-context';
import type { AcceptInvitationDto } from '../auth/dto/auth.dto';
import type {
  CreateBranchDto,
  InviteEmployeeDto,
  UpdateBranchDto,
  UpdateCompanySettingsDto,
  UpdateMembershipDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ─── Invitations ─────────────────────────────────────────────────────────

  async acceptInvitation(dto: AcceptInvitationDto) {
    const tokenHash = hashToken(dto.token);
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { tenant: true },
    });

    if (
      !invitation ||
      invitation.status !== 'pending' ||
      invitation.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (!invitation.roleId) {
      throw new BadRequestException('Invitation missing role');
    }

    const email = invitation.email.toLowerCase();
    const passwordHash = await this.password.hash(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            id: newId(),
            email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            emailVerifiedAt: new Date(),
          },
        });
      } else {
        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            firstName: dto.firstName ?? user.firstName,
            lastName: dto.lastName ?? user.lastName,
          },
        });
      }

      const existingMembership = await tx.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: invitation.tenantId,
            userId: user.id,
          },
        },
      });

      let membershipId: string;
      if (existingMembership) {
        await tx.membership.update({
          where: { id: existingMembership.id },
          data: {
            status: 'active',
            roleId: invitation.roleId!,
            acceptedAt: new Date(),
          },
        });
        membershipId = existingMembership.id;
      } else {
        membershipId = newId();
        await tx.membership.create({
          data: {
            id: membershipId,
            tenantId: invitation.tenantId,
            userId: user.id,
            roleId: invitation.roleId!,
            status: 'active',
            invitedAt: invitation.createdAt,
            acceptedAt: new Date(),
          },
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
          membershipId,
        },
      });

      // Advance onboarding when owner accepts
      if (invitation.kind === 'owner') {
        await tx.tenant.update({
          where: { id: invitation.tenantId },
          data: { onboardingStep: 'profile' },
        });
      }

      return {
        userId: user.id,
        membershipId,
        tenantSlug: invitation.tenant.slug,
      };
    });

    return result;
  }

  // ─── Branches ────────────────────────────────────────────────────────────

  async listBranches(auth: AuthContext) {
    const tenantId = this.requireTenant(auth);
    const where: { tenantId: string; id?: { in: string[] }; archivedAt: null } =
      {
        tenantId,
        archivedAt: null,
      };

    // Branch Manager: filter to assigned branches
    if (auth.branchIds !== null && auth.branchIds !== undefined) {
      where.id = { in: auth.branchIds };
    }

    const branches = await this.prisma.branch.findMany({
      where,
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    });
    return { data: branches };
  }

  async createBranch(auth: AuthContext, dto: CreateBranchDto) {
    this.requirePermission(auth, 'organization.branches.manage');
    const tenantId = this.requireTenant(auth);

    const branch = await this.prisma.branch.create({
      data: {
        id: newId(),
        tenantId,
        name: dto.name,
        code: dto.code,
        city: dto.city,
        countryCode: dto.countryCode,
        addressLine: dto.addressLine,
      },
    });
    return { data: branch };
  }

  async updateBranch(
    auth: AuthContext,
    branchId: string,
    dto: UpdateBranchDto,
  ) {
    this.requirePermission(auth, 'organization.branches.manage');
    const tenantId = this.requireTenant(auth);
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const updated = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: dto.name,
        code: dto.code,
        city: dto.city,
        countryCode: dto.countryCode,
        addressLine: dto.addressLine,
        isActive: dto.isActive,
      },
    });
    return { data: updated };
  }

  async archiveBranch(auth: AuthContext, branchId: string) {
    this.requirePermission(auth, 'organization.branches.manage');
    const tenantId = this.requireTenant(auth);
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch.isMain) {
      throw new BadRequestException('Cannot archive main branch');
    }

    const updated = await this.prisma.branch.update({
      where: { id: branchId },
      data: { archivedAt: new Date(), isActive: false },
    });
    return { data: updated };
  }

  // ─── Employees / memberships ─────────────────────────────────────────────

  async listEmployees(auth: AuthContext) {
    this.requirePermission(auth, 'organization.employees.view');
    const tenantId = this.requireTenant(auth);

    const memberships = await this.prisma.membership.findMany({
      where: {
        tenantId,
        status: { not: 'removed' },
        ...(auth.branchIds
          ? {
              OR: [
                { defaultBranchId: { in: auth.branchIds } },
                { branchScopes: { some: { branchId: { in: auth.branchIds } } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        role: { select: { id: true, key: true, name: true } },
        defaultBranch: { select: { id: true, name: true } },
        branchScopes: { include: { branch: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return { data: memberships };
  }

  async inviteEmployee(auth: AuthContext, dto: InviteEmployeeDto) {
    this.requirePermission(auth, 'organization.employees.manage');
    const tenantId = this.requireTenant(auth);
    const email = dto.email.toLowerCase();

    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });
    if (!role) throw new NotFoundException('Role not found');

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      const existingMembership = await this.prisma.membership.findUnique({
        where: {
          tenantId_userId: { tenantId, userId: existingUser.id },
        },
      });
      if (existingMembership && existingMembership.status !== 'removed') {
        throw new ConflictException('User already a member');
      }
    }

    const inviteRaw = generateOpaqueToken(32);
    const invitation = await this.prisma.invitation.create({
      data: {
        id: newId(),
        tenantId,
        email,
        kind: 'employee',
        status: 'pending',
        roleId: dto.roleId,
        tokenHash: hashToken(inviteRaw),
        invitedById: auth.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Store branch scope intent on a pending membership if user exists,
    // otherwise applied on accept (MVP: create membership as invited)
    let user = existingUser;
    if (!user) {
      // Placeholder user without usable password until accept
      const placeholderHash = await this.password.hash(generateOpaqueToken(24));
      user = await this.prisma.user.create({
        data: {
          id: newId(),
          email,
          passwordHash: placeholderHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
      });
    }

    const membershipId = newId();
    await this.prisma.membership.create({
      data: {
        id: membershipId,
        tenantId,
        userId: user.id,
        roleId: dto.roleId,
        status: 'invited',
        defaultBranchId: dto.defaultBranchId,
        invitedAt: new Date(),
      },
    });

    if (dto.branchIds?.length) {
      for (const branchId of dto.branchIds) {
        await this.prisma.membershipBranch.create({
          data: { id: newId(), membershipId, branchId },
        });
      }
    }

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { membershipId },
    });

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const webOrigin =
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
    await this.mail.enqueueInvitationEmail({
      to: email,
      tenantName: tenant.displayName,
      inviteUrl: `${webOrigin}/invite/accept?token=${inviteRaw}`,
      kind: 'employee',
      tenantId,
    });

    return {
      data: {
        invitationId: invitation.id,
        membershipId,
        email,
        token: inviteRaw,
      },
    };
  }

  async updateMembership(
    auth: AuthContext,
    membershipId: string,
    dto: UpdateMembershipDto,
  ) {
    this.requirePermission(auth, 'organization.employees.manage');
    const tenantId = this.requireTenant(auth);

    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!membership) throw new NotFoundException('Membership not found');

    if (dto.roleId) {
      const role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, tenantId },
      });
      if (!role) throw new NotFoundException('Role not found');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        roleId: dto.roleId,
        status: dto.status,
        defaultBranchId: dto.defaultBranchId,
      },
    });

    if (dto.branchIds) {
      await this.prisma.membershipBranch.deleteMany({
        where: { membershipId },
      });
      for (const branchId of dto.branchIds) {
        await this.prisma.membershipBranch.create({
          data: { id: newId(), membershipId, branchId },
        });
      }
    }

    return { data: updated };
  }

  async listRoles(auth: AuthContext) {
    this.requirePermission(auth, 'organization.roles.view');
    const tenantId = this.requireTenant(auth);
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
    return {
      data: roles.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        isSystem: r.isSystem,
        isBranchScoped: r.isBranchScoped,
        permissions: r.rolePermissions.map((rp) => rp.permission.key),
      })),
    };
  }

  // ─── Settings ────────────────────────────────────────────────────────────

  async getSettings(auth: AuthContext) {
    this.requirePermission(auth, 'settings.company.view');
    const tenantId = this.requireTenant(auth);
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    return {
      data: {
        id: tenant.id,
        slug: tenant.slug,
        legalName: tenant.legalName,
        displayName: tenant.displayName,
        defaultCurrency: tenant.defaultCurrency,
        defaultLanguage: tenant.defaultLanguage,
        timezone: tenant.timezone,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        onboardingStep: tenant.onboardingStep,
        onboardingCompletedAt: tenant.onboardingCompletedAt,
        status: tenant.status,
        writeMode: tenant.writeMode,
      },
    };
  }

  async updateSettings(auth: AuthContext, dto: UpdateCompanySettingsDto) {
    this.requirePermission(auth, 'settings.company.manage');
    const tenantId = this.requireTenant(auth);

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        displayName: dto.displayName,
        legalName: dto.legalName,
        defaultCurrency: dto.defaultCurrency,
        defaultLanguage: dto.defaultLanguage,
        timezone: dto.timezone,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        onboardingStep: dto.onboardingStep,
        onboardingCompletedAt:
          dto.onboardingStep === 'completed' ? new Date() : undefined,
      },
    });

    return { data: tenant };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Apply branch scope filter to a query branchId field. */
  applyBranchScope(
    auth: AuthContext,
    branchId?: string | null,
  ): { branchId?: string | { in: string[] } } {
    if (auth.branchIds === null || auth.branchIds === undefined) {
      return branchId ? { branchId } : {};
    }
    if (branchId) {
      if (!auth.branchIds.includes(branchId)) {
        throw new ForbiddenException('Forbidden');
      }
      return { branchId };
    }
    return { branchId: { in: auth.branchIds } };
  }

  private requireTenant(auth: AuthContext): string {
    if (!auth.tenant?.tenantId) {
      throw new ForbiddenException('Forbidden');
    }
    return auth.tenant.tenantId;
  }

  private requirePermission(auth: AuthContext, key: string) {
    if (!auth.permissions.has(key)) {
      throw new ForbiddenException('Forbidden');
    }
  }
}
