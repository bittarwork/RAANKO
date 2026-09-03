import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import { parsePage } from '../common/utils/pagination';
import type { AuthContext } from '../common/types/auth-context';
import type {
  CreateCustomerActivityDto,
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async list(auth: AuthContext, page?: number, pageSize?: number, search?: string) {
    const tenantId = requireTenantId(auth);
    const paging = parsePage(page, pageSize);
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { legalName: { contains: search, mode: 'insensitive' } },
              { displayName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: paging.skip,
        take: paging.take,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: items,
      meta: { page: paging.page, pageSize: paging.pageSize, total },
    };
  }

  async get(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return { data: customer };
  }

  async create(auth: AuthContext, dto: CreateCustomerDto) {
    const tenantId = requireTenantId(auth);
    const warnings = await this.duplicateWarnings(tenantId, dto.email, dto.phone);
    const customer = await this.prisma.customer.create({
      data: {
        id: newId(),
        tenantId,
        legalName: dto.legalName,
        displayName: dto.displayName?.trim() || dto.legalName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        city: dto.city,
        countryCode: dto.countryCode,
        notes: dto.notes,
        defaultCurrency: dto.defaultCurrency ?? 'EUR',
      },
    });
    return { data: customer, meta: { warnings } };
  }

  async update(auth: AuthContext, id: string, dto: UpdateCustomerDto) {
    const tenantId = requireTenantId(auth);
    await this.requireCustomer(tenantId, id);
    const warnings = await this.duplicateWarnings(
      tenantId,
      dto.email,
      dto.phone,
      id,
    );
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        legalName: dto.legalName,
        displayName: dto.displayName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        city: dto.city,
        countryCode: dto.countryCode,
        notes: dto.notes,
        defaultCurrency: dto.defaultCurrency,
      },
    });
    return { data: customer, meta: { warnings } };
  }

  async softDelete(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    await this.requireCustomer(tenantId, id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { data: customer };
  }

  async listActivities(auth: AuthContext, customerId: string) {
    const tenantId = requireTenantId(auth);
    await this.requireCustomer(tenantId, customerId);
    const activities = await this.prisma.customerActivity.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: activities };
  }

  async addActivity(
    auth: AuthContext,
    customerId: string,
    dto: CreateCustomerActivityDto,
  ) {
    const tenantId = requireTenantId(auth);
    await this.requireCustomer(tenantId, customerId);
    const activity = await this.prisma.customerActivity.create({
      data: {
        id: newId(),
        tenantId,
        customerId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        createdByUserId: auth.userId,
      },
    });
    return { data: activity };
  }

  async exportRows(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const rows = await this.prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { legalName: 'asc' },
    });
    return {
      data: rows.map((c) => ({
        id: c.id,
        legalName: c.legalName,
        displayName: c.displayName,
        email: c.email,
        phone: c.phone,
        city: c.city,
        countryCode: c.countryCode,
        defaultCurrency: c.defaultCurrency,
      })),
    };
  }

  async exportCsv(auth: AuthContext): Promise<string> {
    const { data } = await this.exportRows(auth);
    const header = 'id,legalName,displayName,email,phone,city,countryCode,defaultCurrency';
    const lines = data.map((row) =>
      [
        row.id,
        row.legalName,
        row.displayName,
        row.email ?? '',
        row.phone ?? '',
        row.city ?? '',
        row.countryCode ?? '',
        row.defaultCurrency,
      ]
        .map((value) => this.csvCell(String(value)))
        .join(','),
    );
    return [header, ...lines].join('\n');
  }

  private csvCell(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async importRows(auth: AuthContext, rows: Record<string, unknown>[]) {
    const tenantId = requireTenantId(auth);
    const errors: Array<{ row: number; errors: string[] }> = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] ?? {};
      const issues = this.validateImportRow(row);
      if (issues.length) {
        errors.push({ row: i, errors: issues });
        continue;
      }
      const legalName = String(row.legalName).trim();
      await this.prisma.customer.create({
        data: {
          id: newId(),
          tenantId,
          legalName,
          displayName:
            typeof row.displayName === 'string' && row.displayName.trim()
              ? row.displayName.trim()
              : legalName,
          email:
            typeof row.email === 'string'
              ? row.email.toLowerCase().trim()
              : undefined,
          phone: typeof row.phone === 'string' ? row.phone.trim() : undefined,
          city: typeof row.city === 'string' ? row.city : undefined,
          defaultCurrency: 'EUR',
        },
      });
      successCount += 1;
    }

    const job = await this.prisma.importJob.create({
      data: {
        id: newId(),
        tenantId,
        kind: 'customers',
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

  validateImportRow(row: Record<string, unknown>): string[] {
    const issues: string[] = [];
    if (typeof row.legalName !== 'string' || !row.legalName.trim()) {
      issues.push('legalName is required');
    }
    if (row.email != null && row.email !== '') {
      if (typeof row.email !== 'string' || !row.email.includes('@')) {
        issues.push('email is invalid');
      }
    }
    return issues;
  }

  private async requireCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  private async duplicateWarnings(
    tenantId: string,
    email?: string,
    phone?: string,
    excludeId?: string,
  ): Promise<string[]> {
    const warnings: string[] = [];
    if (email) {
      const match = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          email: email.toLowerCase(),
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (match) warnings.push('Duplicate email in this tenant');
    }
    if (phone) {
      const match = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          phone,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (match) warnings.push('Duplicate phone in this tenant');
    }
    return warnings;
  }
}
