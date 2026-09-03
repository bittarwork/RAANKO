import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { newId } from '../../common/crypto/token.util';
import { requireTenantId } from '../../common/utils/require-tenant';
import type { AuthContext } from '../../common/types/auth-context';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  periodStart(at = new Date()): Date {
    return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
  }

  async increment(tenantId: string, metric: string, amount = 1) {
    const periodStart = this.periodStart();
    const existing = await this.prisma.usageMeter.findUnique({
      where: {
        tenantId_metric_periodStart: { tenantId, metric, periodStart },
      },
    });
    if (!existing) {
      return this.prisma.usageMeter.create({
        data: {
          id: newId(),
          tenantId,
          metric,
          value: amount,
          periodStart,
        },
      });
    }
    return this.prisma.usageMeter.update({
      where: { id: existing.id },
      data: { value: { increment: amount } },
    });
  }

  async listForTenant(tenantId: string) {
    const data = await this.prisma.usageMeter.findMany({
      where: { tenantId },
      orderBy: [{ periodStart: 'desc' }, { metric: 'asc' }],
    });
    return {
      data: data.map((row) => ({
        metric: row.metric,
        value: Number(row.value),
        periodStart: row.periodStart,
      })),
    };
  }

  async companyUsage(auth: AuthContext) {
    return this.listForTenant(requireTenantId(auth));
  }

  async platformUsage(tenantId?: string) {
    const where: Prisma.UsageMeterWhereInput = tenantId ? { tenantId } : {};
    const data = await this.prisma.usageMeter.findMany({
      where,
      orderBy: [{ periodStart: 'desc' }, { metric: 'asc' }],
    });
    return {
      data: data.map((row) => ({
        tenantId: row.tenantId,
        metric: row.metric,
        value: Number(row.value),
        periodStart: row.periodStart,
      })),
    };
  }
}
