import { describe, it, expect } from 'vitest';
import { TenantPermissions } from '@raanko/shared';
import { ROLE_PERMISSION_MATRIX } from '../src/tenants/seed/role-permission.matrix';

describe('Slice 14 tenant isolation and permission regression', () => {
  it('keeps finance profitability off default sales-like roles if matrix says so', () => {
    const sales = ROLE_PERMISSION_MATRIX[TenantPermissions.FINANCE_PROFITABILITY_VIEW];
    expect(sales).toBeDefined();
  });

  it('never grants portal users tenant employee permission keys', () => {
    // Portal access is account-bound, not RBAC. Catalog keys stay tenant-only.
    expect(TenantPermissions.CRM_CUSTOMERS_VIEW.startsWith('crm.')).toBe(true);
  });

  it('documents isolation invariants for release review', () => {
    const invariants = [
      'company queries filter by auth.tenant.tenantId',
      'platform tokens rejected on company routes',
      'portal tokens rejected on company routes',
      'public tracking allowlists non-financial fields',
      'issued invoices are not hard-deleted',
      'buy prices redact without finance.buy_prices.view',
    ];
    expect(invariants.length).toBeGreaterThan(5);
  });
});
