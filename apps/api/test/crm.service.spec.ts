import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AuthSurface } from '@raanko/shared';
import { CrmService } from '../src/crm/crm.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(tenantId = 'tenant-a'): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    membershipId: 'm1',
    roleKey: 'admin',
    permissions: new Set(['crm.customers.view']),
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

describe('CRM tenant isolation and import', () => {
  let prisma: {
    customer: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    importJob: { create: ReturnType<typeof vi.fn> };
  };
  let service: CrmService;

  beforeEach(() => {
    prisma = {
      customer: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      importJob: { create: vi.fn() },
    };
    service = new CrmService(prisma as never);
  });

  it('returns 404 when guessing another tenant customer id', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);
    await expect(service.get(companyAuth('tenant-a'), 'foreign-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-id', tenantId: 'tenant-a', deletedAt: null },
    });
  });

  it('validates import rows and persists only valid ones', async () => {
    prisma.customer.create.mockResolvedValue({ id: 'c1' });
    prisma.importJob.create.mockResolvedValue({ id: 'job1' });

    const result = await service.importRows(companyAuth(), [
      { legalName: 'Valid Co', email: 'ok@example.com' },
      { legalName: '', email: 'bad' },
      { email: 'missing-name@example.com' },
    ]);

    expect(prisma.customer.create).toHaveBeenCalledTimes(1);
    expect(result.data.successCount).toBe(1);
    expect(result.data.errors).toEqual([
      { row: 1, errors: ['legalName is required', 'email is invalid'] },
      { row: 2, errors: ['legalName is required'] },
    ]);
  });

  it('returns duplicate warning but still creates the customer', async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: 'existing' });
    prisma.customer.create.mockResolvedValue({
      id: 'c2',
      legalName: 'Twin',
      email: 'same@example.com',
    });

    const result = await service.create(companyAuth(), {
      legalName: 'Twin',
      email: 'same@example.com',
    });

    expect(result.meta.warnings).toContain('Duplicate email in this tenant');
    expect(prisma.customer.create).toHaveBeenCalled();
  });
});
