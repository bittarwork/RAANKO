import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSurface } from '@raanko/shared';
import { hashToken } from '../src/common/crypto/token.util';

function createPrismaMock() {
  return {
    user: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn() },
    tenant: { findUnique: vi.fn() },
    membership: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    platformRoleAssignment: { findFirst: vi.fn() },
    portalAccount: { findFirst: vi.fn() },
    session: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tenantCustomDomain: { findFirst: vi.fn().mockResolvedValue(null) },
    loginActivity: { create: vi.fn() },
  };
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let password: { verify: ReturnType<typeof vi.fn>; hash: ReturnType<typeof vi.fn> };
  let jwt: { signAsync: ReturnType<typeof vi.fn>; verifyAsync: ReturnType<typeof vi.fn> };
  let config: { get: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    prisma = createPrismaMock();
    password = { verify: vi.fn(), hash: vi.fn() };
    jwt = { signAsync: vi.fn().mockResolvedValue('access.jwt'), verifyAsync: vi.fn() };
    config = { get: vi.fn().mockReturnValue('test-secret-min-32-chars-long!!') };
    service = new AuthService(
      prisma as never,
      password as never,
      jwt as never,
      config as never,
    );
    prisma.loginActivity.create.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
  });

  it('rejects company login when subdomain tenant does not match membership tenant', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      email: 'a@example.com',
      passwordHash: 'hash',
      firstName: null,
      lastName: null,
      totpEnabledAt: null,
      totpSecretEncrypted: null,
    });
    password.verify.mockResolvedValue(true);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-a',
      slug: 'acme',
      status: 'trial',
      writeMode: 'full',
      displayName: 'Acme',
      primaryColor: null,
      logoUrl: null,
    });
    // No membership for this tenant
    prisma.membership.findFirst.mockResolvedValue(null);

    await expect(
      service.loginCompany('a@example.com', 'password12', 'acme', {
        host: 'acme.localhost',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects company login when host slug mismatches body tenantSlug', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      email: 'a@example.com',
      passwordHash: 'hash',
      firstName: null,
      lastName: null,
    });
    password.verify.mockResolvedValue(true);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-a',
      slug: 'acme',
      status: 'trial',
      writeMode: 'full',
    });

    await expect(
      service.loginCompany('a@example.com', 'password12', 'other', {
        host: 'acme.localhost',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blocks company login for suspended tenant', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      email: 'a@example.com',
      passwordHash: 'hash',
      firstName: null,
      lastName: null,
    });
    password.verify.mockResolvedValue(true);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-a',
      slug: 'acme',
      status: 'suspended',
      writeMode: 'blocked',
      displayName: 'Acme',
    });

    await expect(
      service.loginCompany('a@example.com', 'password12', 'acme', {
        host: 'acme.localhost',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rotates refresh token and revokes previous', async () => {
    const raw = 'old-refresh-token';
    const existing = {
      id: 'rt1',
      tokenHash: hashToken(raw),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      sessionId: 'sess1',
      userId: 'user1',
      authSurface: AuthSurface.PLATFORM,
      tenantId: null,
      membershipId: null,
      portalAccountId: null,
      session: { revokedAt: null },
      user: {
        id: 'user1',
        email: 'admin@raanko.com',
        firstName: 'A',
        lastName: 'B',
      },
    };
    prisma.refreshToken.findUnique.mockResolvedValue(existing);
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.session.update.mockResolvedValue({});
    prisma.platformRoleAssignment.findFirst.mockResolvedValue({
      role: 'super_admin',
    });

    const result = await service.refresh(raw, {});
    expect(result.accessToken).toBe('access.jwt');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt1' },
        data: { revokedAt: expect.any(Date) },
      }),
    );
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('revokes session family when a revoked refresh token is reused', async () => {
    const raw = 'reused-token';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      tokenHash: hashToken(raw),
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      sessionId: 'sess1',
      session: { revokedAt: null },
      user: { id: 'user1', email: 'a@b.com', firstName: null, lastName: null },
      authSurface: AuthSurface.PLATFORM,
      tenantId: null,
      membershipId: null,
      portalAccountId: null,
      userId: 'user1',
    });
    prisma.session.update.mockResolvedValue({});
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.refresh(raw, {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sess1' },
        data: expect.objectContaining({ revokedReason: 'suspicious_reuse' }),
      }),
    );
  });

  it('requires Super Admin 2FA when ENFORCE_PLATFORM_2FA is true', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'ENFORCE_PLATFORM_2FA') return 'true';
      return 'test-secret-min-32-chars-long!!';
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin1',
      email: 'admin@raanko.com',
      passwordHash: 'hash',
      firstName: null,
      lastName: null,
      totpEnabledAt: null,
      totpSecretEncrypted: null,
    });
    password.verify.mockResolvedValue(true);
    prisma.platformRoleAssignment.findFirst.mockResolvedValue({
      role: 'super_admin',
      isActive: true,
    });

    await expect(
      service.loginPlatform('admin@raanko.com', 'password12', undefined, {}),
    ).rejects.toMatchObject({ response: expect.objectContaining({ code: 'TOTP_REQUIRED' }) });
  });

  it('rejects switch-tenant when membership is not owned by the user', async () => {
    prisma.membership.findFirst.mockResolvedValue(null);
    await expect(
      service.switchTenant('user-a', 'sess-1', 'membership-other', {}),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'MEMBERSHIP_NOT_OWNED' }),
    });
  });
});
