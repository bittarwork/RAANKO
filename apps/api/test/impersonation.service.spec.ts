import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AuthSurface } from '@raanko/shared';
import { ImpersonationService } from '../src/phase2/impersonation/impersonation.service';
import type { AuthContext } from '../src/common/types/auth-context';

function platformAuth(): AuthContext {
  return {
    userId: 'platform-user',
    sessionId: 's1',
    authSurface: AuthSurface.PLATFORM,
    email: 'admin@raanko.test',
    platformRole: 'super_admin',
    permissions: new Set(['platform.tenants.update']),
  };
}

describe('ImpersonationService', () => {
  let prisma: {
    tenant: { findUnique: ReturnType<typeof vi.fn> };
    impersonationSession: { create: ReturnType<typeof vi.fn> };
    platformAuditLog: { create: ReturnType<typeof vi.fn> };
  };
  let service: ImpersonationService;

  beforeEach(() => {
    prisma = {
      tenant: { findUnique: vi.fn() },
      impersonationSession: { create: vi.fn() },
      platformAuditLog: { create: vi.fn() },
    };
    service = new ImpersonationService(prisma as never);
  });

  it('writes an audit log when impersonation starts', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-a' });
    prisma.impersonationSession.create.mockResolvedValue({
      id: 'imp-1',
      platformUserId: 'platform-user',
      tenantId: 'tenant-a',
      startedAt: new Date(),
      reason: 'platform_support',
    });
    prisma.platformAuditLog.create.mockResolvedValue({});

    const result = await service.start(platformAuth(), 'tenant-a', 'platform_support');

    expect(result.data.sessionId).toBe('imp-1');
    expect(prisma.platformAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: 'platform-user',
          tenantId: 'tenant-a',
          action: 'impersonation.start',
          entityType: 'impersonation_session',
          entityId: 'imp-1',
        }),
      }),
    );
  });

  it('rejects unknown tenants', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);
    await expect(service.start(platformAuth(), 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
