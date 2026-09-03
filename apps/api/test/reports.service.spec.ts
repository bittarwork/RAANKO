import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthSurface, TenantPermissions } from '@raanko/shared';
import { ReportsService } from '../src/reports/reports.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(perms: string[], tenantId = 'tenant-a'): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    permissions: new Set(perms),
    tenant: {
      tenantId,
      tenantSlug: tenantId === 'tenant-a' ? 'acme' : 'beta',
      writeMode: 'full',
      subscriptionStatus: 'active',
      entitlements: new Set(),
      displayName: 'Acme',
    },
  };
}

describe('ReportsService', () => {
  let prisma: {
    customer: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    shipment: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    quote: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
    customerInvoice: { count: ReturnType<typeof vi.fn> };
    companySupportRequest: { count: ReturnType<typeof vi.fn> };
  };
  let service: ReportsService;

  beforeEach(() => {
    prisma = {
      customer: { count: vi.fn(), findMany: vi.fn() },
      shipment: { count: vi.fn(), findMany: vi.fn() },
      quote: { count: vi.fn(), findMany: vi.fn() },
      customerInvoice: { count: vi.fn() },
      companySupportRequest: { count: vi.fn() },
    };
    service = new ReportsService(prisma as never);
  });

  it('omits dashboard widgets the user cannot view', async () => {
    const auth = companyAuth([
      TenantPermissions.REPORTS_DASHBOARD_VIEW,
      TenantPermissions.SHIPMENTS_VIEW,
    ]);
    prisma.shipment.count.mockResolvedValue(4);
    const result = await service.dashboard(auth);
    expect(result.data.widgets).toEqual({ shipments: 4 });
    expect(result.data.widgets).not.toHaveProperty('customers');
    expect(result.data.widgets).not.toHaveProperty('invoices');
    expect(prisma.customer.count).not.toHaveBeenCalled();
  });

  it('scopes search to the current tenant', async () => {
    prisma.customer.findMany.mockResolvedValue([]);
    prisma.shipment.findMany.mockResolvedValue([]);
    prisma.quote.findMany.mockResolvedValue([]);
    await service.search(companyAuth([TenantPermissions.SEARCH_TENANT_USE], 'tenant-b'), 'HAM');
    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-b' }),
      }),
    );
    expect(prisma.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-b' }),
      }),
    );
  });
});
