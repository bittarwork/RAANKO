import { describe, it, expect, vi } from 'vitest';
import { AuthSurface } from '@raanko/shared';
import { PortalService } from '../src/portal/portal.service';
import { QuotesService } from '../src/quotes/quotes.service';
import type { AuthContext } from '../src/common/types/auth-context';

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

describe('Portal redaction', () => {
  it('redacts buy prices and margins on portal quotes', async () => {
    const prisma = {
      quote: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'q1',
            status: 'sent',
            customerId: 'cust-1',
            lines: [{ description: 'Ocean', buyAmount: 50, sellAmount: 90 }],
          },
        ]),
      },
    };
    const quotes = new QuotesService(prisma as never, {
      persistGenerated: vi.fn(),
    } as never);
    const portal = new PortalService(
      prisma as never,
      quotes,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const result = await portal.listQuotes(portalAuth());
    expect(result.data[0].lines[0].sellAmount).toBe(90);
    expect(result.data[0].lines[0]).not.toHaveProperty('buyAmount');
    expect(result.data[0].totals).not.toHaveProperty('buyTotal');
  });
});
