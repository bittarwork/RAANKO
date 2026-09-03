import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthSurface } from '@raanko/shared';
import { SupportService } from '../src/support/support.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(tenantId: string): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    permissions: new Set(),
    tenant: {
      tenantId,
      tenantSlug: 'acme',
      writeMode: 'full',
      subscriptionStatus: 'active',
      entitlements: new Set(),
      displayName: 'Acme',
    },
  };
}

describe('SupportService', () => {
  let prisma: {
    raankoSupportTicket: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    companySupportRequest: { findMany: ReturnType<typeof vi.fn> };
  };
  let service: SupportService;

  beforeEach(() => {
    prisma = {
      raankoSupportTicket: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      companySupportRequest: { findMany: vi.fn() },
    };
    service = new SupportService(prisma as never, {
      createAndSend: vi.fn(),
    } as never);
  });

  it('scopes company RAANKO tickets to the current tenant', async () => {
    prisma.raankoSupportTicket.findMany.mockResolvedValue([]);
    await service.listRaankoTicketsForTenant(companyAuth('tenant-a'));
    expect(prisma.raankoSupportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-a' },
      }),
    );
  });

  it('does not leak another tenant ticket on company reply', async () => {
    prisma.raankoSupportTicket.findFirst.mockResolvedValue(null);
    await expect(
      service.replyRaankoTicket('tick-b', { body: 'hello' }, 'u1', false, 'tenant-a'),
    ).rejects.toThrow('Ticket not found');
    expect(prisma.raankoSupportTicket.findFirst).toHaveBeenCalledWith({
      where: { id: 'tick-b', tenantId: 'tenant-a' },
    });
  });
});
