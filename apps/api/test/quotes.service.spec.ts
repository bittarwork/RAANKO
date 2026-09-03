import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthSurface, TenantPermissions } from '@raanko/shared';
import { QuotesService } from '../src/quotes/quotes.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(perms: string[]): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'sales@acme.test',
    membershipId: 'm1',
    roleKey: 'admin',
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

function portalAuth(): AuthContext {
  return {
    userId: 'portal-user',
    sessionId: 's2',
    authSurface: AuthSurface.PORTAL,
    email: 'buyer@example.com',
    permissions: new Set(),
    customerId: 'cust-1',
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

describe('Quote RFQ workflow and portal redaction', () => {
  let prisma: {
    quoteRequest: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    quote: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    customer: { findFirst: ReturnType<typeof vi.fn> };
  };
  let service: QuotesService;

  beforeEach(() => {
    prisma = {
      quoteRequest: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      quote: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      customer: { findFirst: vi.fn() },
    };
    service = new QuotesService(prisma as never, {
      persistGenerated: vi.fn().mockResolvedValue({ id: 'doc1' }),
    } as never);
  });

  it('creates RFQ then quote, send, and accept', async () => {
    const auth = companyAuth([
      TenantPermissions.QUOTES_CREATE,
      TenantPermissions.QUOTES_APPROVE,
      TenantPermissions.FINANCE_BUY_PRICES_VIEW,
      TenantPermissions.FINANCE_MARGINS_VIEW,
    ]);
    prisma.quoteRequest.create.mockResolvedValue({
      id: 'rfq1',
      status: 'received',
    });
    prisma.quoteRequest.findFirst.mockResolvedValue({ id: 'rfq1' });
    prisma.quote.create.mockResolvedValue({
      id: 'q1',
      status: 'draft',
      quoteFamilyId: 'fam1',
      versionNumber: 1,
      lines: [{ description: 'Freight', buyAmount: 80, sellAmount: 100 }],
    });
    prisma.quoteRequest.update.mockResolvedValue({});
    prisma.quote.findFirst.mockResolvedValue({
      id: 'q1',
      status: 'draft',
      lines: [{ description: 'Freight', buyAmount: 80, sellAmount: 100 }],
    });
    prisma.quote.update
      .mockResolvedValueOnce({
        id: 'q1',
        status: 'sent',
        lines: [{ description: 'Freight', buyAmount: 80, sellAmount: 100 }],
      })
      .mockResolvedValueOnce({
        id: 'q1',
        status: 'accepted',
        lines: [{ description: 'Freight', buyAmount: 80, sellAmount: 100 }],
      });

    const rfq = await service.createRfq(auth, { origin: 'HAM', destination: 'DAM' });
    expect(rfq.data.id).toBe('rfq1');

    const quote = await service.createQuote(auth, {
      quoteRequestId: 'rfq1',
      lines: [{ description: 'Freight', buyAmount: 80, sellAmount: 100 }],
    });
    expect(quote.data.status).toBe('draft');
    expect(quote.data.totals.margin).toBe(20);

    prisma.quote.findFirst.mockResolvedValueOnce({
      id: 'q1',
      status: 'draft',
      lines: [{ buyAmount: 80, sellAmount: 100 }],
    });
    const sent = await service.sendQuote(auth, 'q1');
    expect(sent.data.status).toBe('sent');

    prisma.quote.findFirst.mockResolvedValueOnce({
      id: 'q1',
      status: 'sent',
      lines: [{ buyAmount: 80, sellAmount: 100 }],
    });
    const accepted = await service.acceptQuote(auth, 'q1');
    expect(accepted.data.status).toBe('accepted');
  });

  it('redacts buy amount and margin for portal users', () => {
    const presented = service.presentQuote(portalAuth(), {
      id: 'q1',
      status: 'sent',
      lines: [{ description: 'Ocean', buyAmount: 50, sellAmount: 90 }],
    });
    expect(presented.lines[0].sellAmount).toBe(90);
    expect(presented.lines[0]).not.toHaveProperty('buyAmount');
    expect(presented.lines[0]).not.toHaveProperty('margin');
    expect(presented.totals).not.toHaveProperty('buyTotal');
    expect(presented.totals).not.toHaveProperty('margin');
  });

  it('queues a PDF stub job', async () => {
    prisma.quote.findFirst.mockResolvedValue({
      id: 'q1',
      status: 'draft',
      lines: [],
    });
    const result = await service.queuePdf(companyAuth([]), 'q1');
    expect(result.data.status).toBe('queued');
    expect(result.data.documentId).toBe('doc1');
  });
});
