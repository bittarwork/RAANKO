import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AuthSurface, TenantPermissions } from '@raanko/shared';
import { FinanceService } from '../src/finance/finance.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(perms: string[]): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'acc@acme.test',
    permissions: new Set(perms),
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

describe('FinanceService', () => {
  let prisma: Record<string, unknown>;
  let service: FinanceService;

  beforeEach(() => {
    const customerInvoice = {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    prisma = {
      customerInvoice,
      payment: { create: vi.fn() },
      expense: { create: vi.fn(), findMany: vi.fn() },
      quoteLine: { findMany: vi.fn() },
      shipment: { findFirst: vi.fn() },
      financialAuditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    };
    service = new FinanceService(prisma as never, {
      persistGenerated: vi.fn().mockResolvedValue({ id: 'doc1' }),
    } as never);
  });

  it('separates profitability from invoice view', async () => {
    const auth = companyAuth([TenantPermissions.FINANCE_INVOICES_VIEW]);
    await expect(service.shipmentProfitability(auth, 'sh1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('calculates profit from quote lines minus expenses', async () => {
    const auth = companyAuth([TenantPermissions.FINANCE_PROFITABILITY_VIEW]);
    (prisma.shipment as { findFirst: ReturnType<typeof vi.fn> }).findFirst.mockResolvedValue({
      id: 'sh1',
      quoteId: 'q1',
    });
    (prisma.quoteLine as { findMany: ReturnType<typeof vi.fn> }).findMany.mockResolvedValue([
      { sellAmount: 200, buyAmount: 80 },
      { sellAmount: 50, buyAmount: 20 },
    ]);
    (prisma.expense as { findMany: ReturnType<typeof vi.fn> }).findMany.mockResolvedValue([
      { amount: 10 },
    ]);
    const result = await service.shipmentProfitability(auth, 'sh1');
    expect(result.data.sellTotal).toBe(250);
    expect(result.data.buyTotal).toBe(100);
    expect(result.data.expenseTotal).toBe(10);
    expect(result.data.profit).toBe(140);
  });

  it('writes an audit log on invoice create', async () => {
    const auth = companyAuth([TenantPermissions.FINANCE_INVOICES_CREATE]);
    (prisma.customerInvoice as { create: ReturnType<typeof vi.fn> }).create.mockResolvedValue({
      id: 'inv1',
      status: 'draft',
      currency: 'EUR',
      subtotal: 100,
      tax: 0,
      total: 100,
      paidAmount: 0,
      outstanding: 0,
      number: 'INV-1',
      customerId: 'c1',
      shipmentId: null,
      notes: null,
      issuedAt: null,
    });
    await service.createCustomerInvoice(auth, {
      customerId: 'c1',
      subtotal: 100,
    });
    expect(prisma.financialAuditLog.create).toHaveBeenCalled();
  });

  it('refuses to hard-delete an issued invoice', async () => {
    (prisma.customerInvoice as { findFirst: ReturnType<typeof vi.fn> }).findFirst.mockResolvedValue({
      id: 'inv1',
      status: 'issued',
    });
    await expect(
      service.deleteCustomerInvoice(companyAuth([TenantPermissions.FINANCE_INVOICES_DELETE]), 'inv1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      (prisma.customerInvoice as { delete: ReturnType<typeof vi.fn> }).delete,
    ).not.toHaveBeenCalled();
  });
});
