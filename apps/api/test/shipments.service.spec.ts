import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthSurface } from '@raanko/shared';
import { OperationsService } from '../src/operations/operations.service';
import { canTransitionShipment } from '../src/operations/shipment-status';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    membershipId: 'm1',
    roleKey: 'shipping_ops',
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

describe('Shipment workflow and public tracking', () => {
  let prisma: {
    shipment: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    tenant: { findUnique: ReturnType<typeof vi.fn> };
  };
  let service: OperationsService;

  beforeEach(() => {
    prisma = {
      shipment: { findFirst: vi.fn(), update: vi.fn() },
      tenant: { findUnique: vi.fn() },
      tenantCustomDomain: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    service = new OperationsService(prisma as never);
  });

  it('rejects invalid status transitions', async () => {
    prisma.shipment.findFirst.mockResolvedValue({
      id: 'sh1',
      status: 'draft',
    });
    await expect(
      service.changeStatus(companyAuth(), 'sh1', 'delivered'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(canTransitionShipment('draft', 'delivered')).toBe(false);
    expect(canTransitionShipment('draft', 'booked')).toBe(true);
  });

  it('returns only public allowlisted tracking fields', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-a',
      slug: 'acme',
      status: 'suspended',
    });
    prisma.shipment.findFirst.mockResolvedValue({
      id: 'sh1',
      tenantId: 'tenant-a',
      trackingNumber: 'RKTEST123',
      status: 'in_transit',
      origin: 'HAM',
      destination: 'DAM',
      mode: 'ocean',
      notes: 'internal only',
      customerId: 'cust-secret',
      quoteId: 'quote-secret',
      events: [
        {
          occurredAt: new Date('2026-01-01T00:00:00Z'),
          status: 'booked',
          message: 'Picked up',
          isPublic: true,
        },
      ],
    });

    const result = await service.publicTrack('RKTEST123', 'acme', undefined);
    expect(Object.keys(result.data).sort()).toEqual(
      ['destination', 'events', 'mode', 'origin', 'status', 'trackingNumber'].sort(),
    );
    expect(result.data).not.toHaveProperty('notes');
    expect(result.data).not.toHaveProperty('customerId');
    expect(result.data).not.toHaveProperty('quoteId');
    expect(result.data.events[0]).not.toHaveProperty('isPublic');
  });

  it('isolates tracking numbers across tenants', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant-b',
      slug: 'other',
    });
    prisma.shipment.findFirst.mockResolvedValue(null);

    await expect(
      service.publicTrack('RKTEST123', 'other', undefined),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.shipment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-b', trackingNumber: 'RKTEST123' },
      }),
    );
  });
});
