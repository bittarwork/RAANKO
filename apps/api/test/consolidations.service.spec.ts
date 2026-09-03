import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AuthSurface } from '@raanko/shared';
import { ConsolidationsService } from '../src/phase2/consolidations/consolidations.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    permissions: new Set(),
    tenant: {
      tenantId: 'tenant-a',
      tenantSlug: 'acme',
      writeMode: 'full',
      subscriptionStatus: 'active',
      entitlements: new Set(),
      displayName: 'Acme',
    },
  };
}

describe('ConsolidationsService', () => {
  let prisma: {
    shipment: { findFirst: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    shipmentConsolidation: { create: ReturnType<typeof vi.fn> };
  };
  let service: ConsolidationsService;

  beforeEach(() => {
    prisma = {
      shipment: { findFirst: vi.fn(), findMany: vi.fn() },
      shipmentConsolidation: { create: vi.fn() },
    };
    service = new ConsolidationsService(prisma as never);
  });

  it('rejects house shipment ids that are not in the same tenant', async () => {
    prisma.shipment.findFirst.mockResolvedValue({ id: 'master-1', tenantId: 'tenant-a' });
    prisma.shipment.findMany.mockResolvedValue([{ id: 'house-1' }]);

    await expect(
      service.create(companyAuth(), {
        masterShipmentId: 'master-1',
        houseShipmentIds: ['house-1', 'other-tenant-house'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.shipment.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['house-1', 'other-tenant-house'] }, tenantId: 'tenant-a' },
    });
  });
});
