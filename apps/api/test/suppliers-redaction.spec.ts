import { describe, it, expect } from 'vitest';
import { AuthSurface, TenantPermissions } from '@raanko/shared';
import { SuppliersService } from '../src/suppliers/suppliers.service';
import type { AuthContext } from '../src/common/types/auth-context';

function authWith(perms: string[]): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    membershipId: 'm1',
    roleKey: 'sales',
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

describe('Buy price redaction', () => {
  const service = new SuppliersService({} as never);
  const sheet = {
    id: 'rs1',
    name: 'Ocean',
    lines: [{ id: 'l1', origin: 'HAM', destination: 'DAM', buyRate: 1200 }],
  };

  it('hides buyRate without finance.buy_prices.view', () => {
    const presented = service.redactSheet(authWith([]), sheet);
    expect(presented.lines[0]).not.toHaveProperty('buyRate');
    expect(presented.lines[0].origin).toBe('HAM');
  });

  it('keeps buyRate when finance.buy_prices.view is granted', () => {
    const presented = service.redactSheet(
      authWith([TenantPermissions.FINANCE_BUY_PRICES_VIEW]),
      sheet,
    );
    expect(presented.lines[0].buyRate).toBe(1200);
  });
});
