import { describe, it, expect, vi } from 'vitest';
import { AuthSurface, TenantPermissions } from '@raanko/shared';
import { QuotesService } from '../src/quotes/quotes.service';
import { OperationsService } from '../src/operations/operations.service';
import { FinanceService } from '../src/finance/finance.service';
import type { AuthContext } from '../src/common/types/auth-context';

function opsAuth(): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    permissions: new Set([
      TenantPermissions.QUOTES_RFQ_MANAGE,
      TenantPermissions.QUOTES_CREATE,
      TenantPermissions.BOOKINGS_CREATE,
      TenantPermissions.FINANCE_INVOICES_CREATE,
    ]),
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

describe('E2E flow quote → shipment → invoice (service composition)', () => {
  it('walks the Beta demo path with mocked persistence', async () => {
    const auth = opsAuth();

    const quotesPrisma = {
      customer: {
        findFirst: vi.fn().mockResolvedValue({ id: 'c1', tenantId: 'tenant-a' }),
      },
      quoteRequest: {
        create: vi.fn().mockResolvedValue({ id: 'rfq1', status: 'received' }),
      },
    };
    const quotes = new QuotesService(quotesPrisma as never, {
      persistGenerated: vi.fn(),
    } as never);
    const rfq = await quotes.createRfq(auth, { customerId: 'c1', origin: 'Hamburg' });
    expect(rfq.data.id).toBe('rfq1');

    const tx = {
      shipment: {
        create: vi.fn().mockResolvedValue({ id: 'sh1', trackingNumber: 'TRK-1' }),
        update: vi.fn(),
      },
      booking: {
        create: vi.fn().mockResolvedValue({ id: 'b1', quoteId: 'q1', shipmentId: 'sh1' }),
      },
    };
    const opsPrisma = {
      quote: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'q1',
          status: 'accepted',
          customerId: 'c1',
        }),
      },
      $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };
    const operations = new OperationsService(opsPrisma as never);
    const booking = await operations.createBooking(auth, { quoteId: 'q1' });
    expect(booking.data.booking.id).toBe('b1');
    expect(booking.data.shipment?.id).toBe('sh1');

    const financePrisma = {
      customerInvoice: {
        create: vi.fn().mockResolvedValue({
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
          shipmentId: 'sh1',
          notes: null,
          issuedAt: null,
        }),
      },
      financialAuditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const finance = new FinanceService(financePrisma as never, {
      persistGenerated: vi.fn(),
    } as never);
    const invoice = await finance.createCustomerInvoice(auth, {
      customerId: 'c1',
      shipmentId: 'sh1',
      subtotal: 100,
      currency: 'EUR',
    });
    expect(invoice.data.id).toBe('inv1');
    expect(invoice.data.currency).toBe('EUR');
  });
});
