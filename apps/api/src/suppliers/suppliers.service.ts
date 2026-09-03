import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import {
  canViewBuyPrices,
  toMoneyNumber,
} from '../common/utils/finance-redaction';
import type { AuthContext } from '../common/types/auth-context';
import type {
  CreateChargeTemplateDto,
  CreateRateSheetDto,
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto/suppliers.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async listSuppliers(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  async createSupplier(auth: AuthContext, dto: CreateSupplierDto) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.supplier.create({
      data: {
        id: newId(),
        tenantId,
        name: dto.name,
        code: dto.code,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
      },
    });
    return { data };
  }

  async updateSupplier(auth: AuthContext, id: string, dto: UpdateSupplierDto) {
    const tenantId = requireTenantId(auth);
    await this.requireSupplier(tenantId, id);
    const data = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        email: dto.email,
        phone: dto.phone,
        notes: dto.notes,
        isActive: dto.isActive,
      },
    });
    return { data };
  }

  async listRateSheets(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const sheets = await this.prisma.rateSheet.findMany({
      where: { tenantId },
      include: { lines: true, supplier: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data: sheets.map((sheet) => this.redactSheet(auth, sheet)) };
  }

  async createRateSheet(auth: AuthContext, dto: CreateRateSheetDto) {
    const tenantId = requireTenantId(auth);
    await this.requireSupplier(tenantId, dto.supplierId);
    const sheet = await this.prisma.rateSheet.create({
      data: {
        id: newId(),
        tenantId,
        supplierId: dto.supplierId,
        name: dto.name,
        currency: dto.currency ?? 'EUR',
        lines: {
          create: (dto.lines ?? []).map((line) => ({
            id: newId(),
            tenantId,
            origin: line.origin,
            destination: line.destination,
            mode: line.mode,
            containerType: line.containerType,
            unit: line.unit ?? 'shipment',
            buyRate: line.buyRate,
          })),
        },
      },
      include: { lines: true, supplier: { select: { id: true, name: true } } },
    });
    return { data: this.redactSheet(auth, sheet) };
  }

  async listChargeTemplates(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const templates = await this.prisma.chargeTemplate.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
    return {
      data: templates.map((t) => this.redactCharge(auth, t)),
    };
  }

  async createChargeTemplate(auth: AuthContext, dto: CreateChargeTemplateDto) {
    const tenantId = requireTenantId(auth);
    const template = await this.prisma.chargeTemplate.create({
      data: {
        id: newId(),
        tenantId,
        code: dto.code,
        name: dto.name,
        currency: dto.currency ?? 'EUR',
        defaultSellAmount: dto.defaultSellAmount ?? 0,
        defaultBuyAmount: dto.defaultBuyAmount ?? 0,
      },
    });
    return { data: this.redactCharge(auth, template) };
  }

  async importRates(auth: AuthContext, rows: Record<string, unknown>[]) {
    const tenantId = requireTenantId(auth);
    const errors: Array<{ row: number; errors: string[] }> = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] ?? {};
      const issues: string[] = [];
      if (typeof row.supplierId !== 'string' || !row.supplierId) {
        issues.push('supplierId is required');
      }
      if (typeof row.name !== 'string' || !row.name.trim()) {
        issues.push('name is required');
      }
      if (row.buyRate == null || Number.isNaN(Number(row.buyRate))) {
        issues.push('buyRate is required');
      }
      if (issues.length) {
        errors.push({ row: i, errors: issues });
        continue;
      }
      const supplier = await this.prisma.supplier.findFirst({
        where: { id: String(row.supplierId), tenantId },
      });
      if (!supplier) {
        errors.push({ row: i, errors: ['supplier not found'] });
        continue;
      }
      await this.prisma.rateSheet.create({
        data: {
          id: newId(),
          tenantId,
          supplierId: supplier.id,
          name: String(row.name),
          currency: 'EUR',
          lines: {
            create: [
              {
                id: newId(),
                tenantId,
                origin: typeof row.origin === 'string' ? row.origin : undefined,
                destination:
                  typeof row.destination === 'string'
                    ? row.destination
                    : undefined,
                buyRate: Number(row.buyRate),
              },
            ],
          },
        },
      });
      successCount += 1;
    }

    const job = await this.prisma.importJob.create({
      data: {
        id: newId(),
        tenantId,
        kind: 'rates',
        status: 'completed',
        totalRows: rows.length,
        successCount,
        errorCount: errors.length,
        errors,
        createdByUserId: auth.userId,
      },
    });

    return { data: { job, successCount, errors } };
  }

  redactSheet(
    auth: AuthContext,
    sheet: {
      lines: Array<{ buyRate: unknown } & Record<string, unknown>>;
    } & Record<string, unknown>,
  ) {
    const showBuy = canViewBuyPrices(auth);
    return {
      ...sheet,
      lines: sheet.lines.map((line) => {
        const next = { ...line, buyRate: toMoneyNumber(line.buyRate) };
        if (!showBuy) {
          delete (next as { buyRate?: number }).buyRate;
        }
        return next;
      }),
    };
  }

  redactCharge(
    auth: AuthContext,
    template: {
      defaultBuyAmount: unknown;
      defaultSellAmount: unknown;
    } & Record<string, unknown>,
  ) {
    const showBuy = canViewBuyPrices(auth);
    const next = {
      ...template,
      defaultBuyAmount: toMoneyNumber(template.defaultBuyAmount),
      defaultSellAmount: toMoneyNumber(template.defaultSellAmount),
    };
    if (!showBuy) {
      delete (next as { defaultBuyAmount?: number }).defaultBuyAmount;
    }
    return next;
  }

  private async requireSupplier(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }
}
