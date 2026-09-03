import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CompanyAuthGuard,
  PlatformAuthGuard,
  type AccessTokenPayload,
} from '../src/common/guards/auth.guards';
import { AuthSurface } from '@raanko/shared';
import { TenantWriteModeGuard } from '../src/common/guards/tenant-write-mode.guard';
import { PermissionGuard } from '../src/common/guards/permission.guard';
import { AUTH_CONTEXT_KEY } from '../src/common/types/auth-context';
import { OrganizationService } from '../src/organization/organization.service';

function mockContext(request: Record<string, unknown>, handlerMeta?: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as never;
}

describe('Surface isolation', () => {
  it('rejects platform token on company routes', async () => {
    const jwt = {
      verifyAsync: vi.fn().mockResolvedValue({
        sub: 'u1',
        sid: 's1',
        surface: AuthSurface.PLATFORM,
        email: 'a@b.com',
      } satisfies AccessTokenPayload),
    };
    const config = { get: vi.fn().mockReturnValue('secret') };
    const prisma = {
      session: {
        findFirst: vi.fn().mockResolvedValue({
          id: 's1',
          userId: 'u1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 10000),
        }),
      },
    };
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };

    const guard = new CompanyAuthGuard(
      jwt as never,
      config as never,
      prisma as never,
      reflector as never,
    );

    const request = {
      headers: { authorization: 'Bearer token' },
    };

    await expect(guard.canActivate(mockContext(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows platform token on platform routes when role present', async () => {
    const jwt = {
      verifyAsync: vi.fn().mockResolvedValue({
        sub: 'u1',
        sid: 's1',
        surface: AuthSurface.PLATFORM,
        email: 'a@b.com',
      } satisfies AccessTokenPayload),
    };
    const config = { get: vi.fn().mockReturnValue('secret') };
    const prisma = {
      session: {
        findFirst: vi.fn().mockResolvedValue({
          id: 's1',
          userId: 'u1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 10000),
        }),
      },
      platformRoleAssignment: {
        findFirst: vi.fn().mockResolvedValue({ role: 'super_admin' }),
      },
    };
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };

    const guard = new PlatformAuthGuard(
      jwt as never,
      config as never,
      prisma as never,
      reflector as never,
    );

    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer token' },
    };

    await expect(guard.canActivate(mockContext(request))).resolves.toBe(true);
    expect(request[AUTH_CONTEXT_KEY]).toBeDefined();
  });

  it('returns 401 when bearer missing', async () => {
    const guard = new PlatformAuthGuard(
      { verifyAsync: vi.fn() } as never,
      { get: vi.fn() } as never,
      {} as never,
      { getAllAndOverride: vi.fn().mockReturnValue(false) } as never,
    );
    await expect(
      guard.canActivate(mockContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects portal token on company routes', async () => {
    const jwt = {
      verifyAsync: vi.fn().mockResolvedValue({
        sub: 'u1',
        sid: 's1',
        surface: AuthSurface.PORTAL,
        email: 'buyer@example.com',
        tenantId: 't1',
        portalAccountId: 'p1',
      } satisfies AccessTokenPayload),
    };
    const config = { get: vi.fn().mockReturnValue('secret') };
    const prisma = {
      session: {
        findFirst: vi.fn().mockResolvedValue({
          id: 's1',
          userId: 'u1',
          revokedAt: null,
          expiresAt: new Date(Date.now() + 10000),
        }),
      },
    };
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };
    const guard = new CompanyAuthGuard(
      jwt as never,
      config as never,
      prisma as never,
      reflector as never,
    );
    await expect(
      guard.canActivate(
        mockContext({ headers: { authorization: 'Bearer token' } }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('TenantWriteModeGuard', () => {
  const guard = new TenantWriteModeGuard();

  it('allows GET when tenant is read-only', () => {
    const request = {
      method: 'GET',
      [AUTH_CONTEXT_KEY]: {
        tenant: { writeMode: 'read_only' },
      },
    };
    expect(guard.canActivate(mockContext(request))).toBe(true);
  });

  it('blocks POST when tenant is read-only', () => {
    const request = {
      method: 'POST',
      [AUTH_CONTEXT_KEY]: {
        tenant: { writeMode: 'read_only' },
      },
    };
    try {
      guard.canActivate(mockContext(request));
      expect.fail('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as {
        code?: string;
      };
      expect(response.code).toBe('TENANT_READ_ONLY');
    }
  });
});

describe('PermissionGuard', () => {
  it('returns 403 when permission missing', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue('organization.branches.manage'),
    };
    const guard = new PermissionGuard(reflector as unknown as Reflector);
    const request = {
      [AUTH_CONTEXT_KEY]: {
        permissions: new Set(['organization.branches.view']),
      },
    };
    expect(() => guard.canActivate(mockContext(request))).toThrow(
      ForbiddenException,
    );
  });

  it('allows when permission present', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue('organization.branches.view'),
    };
    const guard = new PermissionGuard(reflector as unknown as Reflector);
    const request = {
      [AUTH_CONTEXT_KEY]: {
        permissions: new Set(['organization.branches.view']),
      },
    };
    expect(guard.canActivate(mockContext(request))).toBe(true);
  });
});

describe('Branch scope filter', () => {
  it('filters branch queries for branch-scoped roles', () => {
    const service = new OrganizationService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const auth = {
      branchIds: ['branch-a', 'branch-b'],
      permissions: new Set(),
      userId: 'u1',
      sessionId: 's1',
      authSurface: AuthSurface.COMPANY,
      email: 'x@y.com',
      tenant: {
        tenantId: 't1',
        tenantSlug: 'acme',
        writeMode: 'full' as const,
        subscriptionStatus: 'trial',
        entitlements: new Set<string>(),
        displayName: 'Acme',
      },
    };

    expect(service.applyBranchScope(auth)).toEqual({
      branchId: { in: ['branch-a', 'branch-b'] },
    });
    expect(service.applyBranchScope(auth, 'branch-a')).toEqual({
      branchId: 'branch-a',
    });
    expect(() => service.applyBranchScope(auth, 'branch-c')).toThrow(
      ForbiddenException,
    );
  });

  it('does not filter for tenant-wide roles (branchIds null)', () => {
    const service = new OrganizationService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const auth = {
      branchIds: null,
      permissions: new Set(),
      userId: 'u1',
      sessionId: 's1',
      authSurface: AuthSurface.COMPANY,
      email: 'x@y.com',
    };
    expect(service.applyBranchScope(auth)).toEqual({});
  });
});
