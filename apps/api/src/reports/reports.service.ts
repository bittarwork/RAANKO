import { ForbiddenException, Injectable } from '@nestjs/common';
import { TenantPermissions } from '@raanko/shared';
import { PrismaService } from '../prisma/prisma.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import { toMoneyNumber } from '../common/utils/finance-redaction';
import type { AuthContext } from '../common/types/auth-context';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(auth: AuthContext) {
    requireTenantId(auth);
    if (!auth.permissions.has(TenantPermissions.REPORTS_DASHBOARD_VIEW)) {
      throw new ForbiddenException('Forbidden');
    }
    const tenantId = requireTenantId(auth);
    const widgets: Record<string, unknown> = {};

    if (auth.permissions.has(TenantPermissions.CRM_CUSTOMERS_VIEW)) {
      widgets.customers = await this.prisma.customer.count({
        where: { tenantId, deletedAt: null },
      });
    }
    if (auth.permissions.has(TenantPermissions.SHIPMENTS_VIEW)) {
      widgets.shipments = await this.prisma.shipment.count({ where: { tenantId } });
    }
    if (auth.permissions.has(TenantPermissions.QUOTES_VIEW)) {
      widgets.quotes = await this.prisma.quote.count({ where: { tenantId } });
    }
    if (auth.permissions.has(TenantPermissions.FINANCE_INVOICES_VIEW)) {
      widgets.invoices = await this.prisma.customerInvoice.count({
        where: { tenantId },
      });
    }
    if (auth.permissions.has(TenantPermissions.SUPPORT_COMPANY_REQUESTS_VIEW)) {
      widgets.openSupportRequests = await this.prisma.companySupportRequest.count({
        where: { tenantId, status: { in: ['open', 'in_progress'] } },
      });
    }
    return { data: { widgets } };
  }

  async operational(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const grouped = await this.prisma.shipment.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });
    return {
      data: {
        shipmentsByStatus: grouped.map((row) => ({
          status: row.status,
          count: row._count._all,
        })),
      },
    };
  }

  async financial(auth: AuthContext) {
    if (!auth.permissions.has(TenantPermissions.FINANCE_REPORTS_VIEW)) {
      throw new ForbiddenException('Forbidden');
    }
    const tenantId = requireTenantId(auth);
    const invoices = await this.prisma.customerInvoice.findMany({
      where: { tenantId, status: 'issued' },
    });
    const outstanding = invoices.reduce(
      (sum, row) => sum + toMoneyNumber(row.outstanding),
      0,
    );
    const billed = invoices.reduce((sum, row) => sum + toMoneyNumber(row.total), 0);
    const expenses = await this.prisma.expense.findMany({ where: { tenantId } });
    const expenseTotal = expenses.reduce(
      (sum, row) => sum + toMoneyNumber(row.amount),
      0,
    );
    return {
      data: {
        currency: 'EUR',
        billed,
        outstanding,
        expenseTotal,
      },
    };
  }

  async search(auth: AuthContext, q: string) {
    const tenantId = requireTenantId(auth);
    if (auth.branchIds && auth.branchIds.length === 0) {
      return { data: { customers: [], shipments: [], quotes: [] } };
    }
    const term = q.trim();
    if (!term) {
      return { data: { customers: [], shipments: [], quotes: [] } };
    }

    const [customers, shipments, quotes] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { legalName: { contains: term, mode: 'insensitive' } },
            { displayName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, legalName: true, displayName: true, email: true },
      }),
      this.prisma.shipment.findMany({
        where: {
          tenantId,
          OR: [
            { trackingNumber: { contains: term, mode: 'insensitive' } },
            { origin: { contains: term, mode: 'insensitive' } },
            { destination: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          origin: true,
          destination: true,
        },
      }),
      this.prisma.quote.findMany({
        where: {
          tenantId,
          OR: [{ notes: { contains: term, mode: 'insensitive' } }, { id: term }],
        },
        take: 10,
        select: { id: true, status: true, currency: true, versionNumber: true },
      }),
    ]);

    return { data: { customers, shipments, quotes } };
  }

  queueExport(auth: AuthContext, kind: string) {
    const tenantId = requireTenantId(auth);
    const jobId = newId();
    console.log(JSON.stringify({ job: 'report.export', kind, tenantId, jobId }));
    return { data: { status: 'queued' as const, jobId, kind } };
  }

  async exportCsv(auth: AuthContext): Promise<string> {
    const tenantId = requireTenantId(auth);
    const grouped = await this.prisma.shipment.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });
    const header = 'status,count';
    const lines = grouped.map((row) => `${row.status},${row._count._all}`);
    return [header, ...lines].join('\n');
  }
}
