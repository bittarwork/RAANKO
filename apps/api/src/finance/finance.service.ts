import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantPermissions } from '@raanko/shared';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import { toMoneyNumber } from '../common/utils/finance-redaction';
import type { AuthContext } from '../common/types/auth-context';
import type {
  CreateCreditNoteDto,
  CreateCustomerInvoiceDto,
  CreateExchangeRateDto,
  CreateExpenseDto,
  CreatePaymentDto,
  CreateSupplierInvoiceDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  async listCustomerInvoices(auth: AuthContext, customerId?: string) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.customerInvoice.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data.map((row) => this.presentInvoice(row)) };
  }

  async createCustomerInvoice(auth: AuthContext, dto: CreateCustomerInvoiceDto) {
    const tenantId = requireTenantId(auth);
    const tax = dto.tax ?? 0;
    const total = dto.subtotal + tax;
    const invoice = await this.prisma.customerInvoice.create({
      data: {
        id: newId(),
        tenantId,
        customerId: dto.customerId,
        shipmentId: dto.shipmentId,
        quoteId: dto.quoteId,
        number: this.nextNumber('INV'),
        status: 'draft',
        currency: dto.currency ?? 'EUR',
        subtotal: dto.subtotal,
        tax,
        total,
        paidAmount: 0,
        outstanding: 0,
        notes: dto.notes,
      },
    });
    await this.audit(auth, 'customer_invoice.create', invoice.id, {
      total,
    });
    return { data: this.presentInvoice(invoice) };
  }

  async issueCustomerInvoice(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const invoice = await this.requireCustomerInvoice(tenantId, id);
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be issued');
    }
    const updated = await this.prisma.customerInvoice.update({
      where: { id },
      data: {
        status: 'issued',
        issuedAt: new Date(),
        outstanding: invoice.total,
      },
    });
    await this.audit(auth, 'customer_invoice.issue', id, {});
    return { data: this.presentInvoice(updated) };
  }

  async deleteCustomerInvoice(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const invoice = await this.requireCustomerInvoice(tenantId, id);
    if (invoice.status === 'issued') {
      throw new ForbiddenException('Issued invoices cannot be deleted');
    }
    await this.prisma.customerInvoice.delete({ where: { id } });
    await this.audit(auth, 'customer_invoice.delete', id, {
      status: invoice.status,
    });
    return { data: { deleted: true } };
  }

  async createSupplierInvoice(auth: AuthContext, dto: CreateSupplierInvoiceDto) {
    const tenantId = requireTenantId(auth);
    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        id: newId(),
        tenantId,
        supplierId: dto.supplierId,
        shipmentId: dto.shipmentId,
        number: this.nextNumber('SIN'),
        status: 'recorded',
        currency: dto.currency ?? 'EUR',
        amount: dto.amount,
        notes: dto.notes,
      },
    });
    await this.audit(auth, 'supplier_invoice.create', invoice.id, {
      amount: dto.amount,
      shipmentId: dto.shipmentId,
    });
    return { data: this.presentMoney(invoice) };
  }

  async listSupplierInvoices(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.supplierInvoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data.map((row) => this.presentMoney(row)) };
  }

  async createPayment(auth: AuthContext, dto: CreatePaymentDto) {
    const tenantId = requireTenantId(auth);
    const invoice = await this.requireCustomerInvoice(
      tenantId,
      dto.customerInvoiceId,
    );
    if (invoice.status !== 'issued') {
      throw new BadRequestException('Payments require an issued invoice');
    }
    const amount = dto.amount;
    const paid = toMoneyNumber(invoice.paidAmount) + amount;
    const outstanding = Math.max(toMoneyNumber(invoice.total) - paid, 0);

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          id: newId(),
          tenantId,
          customerInvoiceId: invoice.id,
          amount,
          currency: dto.currency ?? invoice.currency,
          method: dto.method ?? 'bank',
          notes: dto.notes,
        },
      });
      await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { paidAmount: paid, outstanding },
      });
      return created;
    });
    await this.audit(auth, 'payment.create', payment.id, {
      invoiceId: invoice.id,
      amount,
    });
    return { data: this.presentMoney(payment) };
  }

  async listPayments(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data.map((row) => this.presentMoney(row)) };
  }

  async createExpense(auth: AuthContext, dto: CreateExpenseDto) {
    const tenantId = requireTenantId(auth);
    const expense = await this.prisma.expense.create({
      data: {
        id: newId(),
        tenantId,
        shipmentId: dto.shipmentId,
        category: dto.category ?? 'other',
        amount: dto.amount,
        currency: dto.currency ?? 'EUR',
        notes: dto.notes,
      },
    });
    await this.audit(auth, 'expense.create', expense.id, {
      amount: dto.amount,
      shipmentId: dto.shipmentId,
    });
    return { data: this.presentMoney(expense) };
  }

  async listExpenses(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.expense.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data.map((row) => this.presentMoney(row)) };
  }

  async createCreditNote(auth: AuthContext, dto: CreateCreditNoteDto) {
    const tenantId = requireTenantId(auth);
    const invoice = await this.requireCustomerInvoice(
      tenantId,
      dto.customerInvoiceId,
    );
    if (invoice.status !== 'issued') {
      throw new BadRequestException('Credit notes require an issued invoice');
    }
    const note = await this.prisma.$transaction(async (tx) => {
      const created = await tx.creditNote.create({
        data: {
          id: newId(),
          tenantId,
          customerInvoiceId: invoice.id,
          amount: dto.amount,
          currency: dto.currency ?? invoice.currency,
          reason: dto.reason,
        },
      });
      const outstanding = Math.max(
        toMoneyNumber(invoice.outstanding) - dto.amount,
        0,
      );
      await tx.customerInvoice.update({
        where: { id: invoice.id },
        data: { outstanding },
      });
      return created;
    });
    await this.audit(auth, 'credit_note.create', note.id, {
      invoiceId: invoice.id,
      amount: dto.amount,
    });
    return { data: this.presentMoney(note) };
  }

  async upsertExchangeRate(auth: AuthContext, dto: CreateExchangeRateDto) {
    const tenantId = requireTenantId(auth);
    const effectiveOn = new Date(`${dto.effectiveOn}T00:00:00.000Z`);
    const rate = await this.prisma.exchangeRate.upsert({
      where: {
        tenantId_baseCurrency_quoteCurrency_effectiveOn: {
          tenantId,
          baseCurrency: dto.baseCurrency.toUpperCase(),
          quoteCurrency: dto.quoteCurrency.toUpperCase(),
          effectiveOn,
        },
      },
      create: {
        id: newId(),
        tenantId,
        baseCurrency: dto.baseCurrency.toUpperCase(),
        quoteCurrency: dto.quoteCurrency.toUpperCase(),
        rate: dto.rate,
        effectiveOn,
      },
      update: { rate: dto.rate },
    });
    await this.audit(auth, 'exchange_rate.upsert', rate.id, {
      rate: dto.rate,
    });
    return { data: this.presentMoney(rate) };
  }

  async listExchangeRates(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.exchangeRate.findMany({
      where: { tenantId },
      orderBy: { effectiveOn: 'desc' },
    });
    return { data: data.map((row) => this.presentMoney(row)) };
  }

  async shipmentProfitability(auth: AuthContext, shipmentId: string) {
    if (!auth.permissions.has(TenantPermissions.FINANCE_PROFITABILITY_VIEW)) {
      throw new ForbiddenException('Forbidden');
    }
    const tenantId = requireTenantId(auth);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    let sellTotal = 0;
    let buyTotal = 0;
    if (shipment.quoteId) {
      const lines = await this.prisma.quoteLine.findMany({
        where: { tenantId, quoteId: shipment.quoteId },
      });
      sellTotal = lines.reduce((sum, line) => sum + toMoneyNumber(line.sellAmount), 0);
      buyTotal = lines.reduce((sum, line) => sum + toMoneyNumber(line.buyAmount), 0);
    }
    const expenses = await this.prisma.expense.findMany({
      where: { tenantId, shipmentId },
    });
    const expenseTotal = expenses.reduce(
      (sum, row) => sum + toMoneyNumber(row.amount),
      0,
    );
    const profit = sellTotal - buyTotal - expenseTotal;
    return {
      data: {
        shipmentId,
        currency: 'EUR',
        sellTotal,
        buyTotal,
        expenseTotal,
        profit,
      },
    };
  }

  async queueInvoicePdf(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const invoice = await this.requireCustomerInvoice(tenantId, id);
    const bytes = Buffer.from(
      `RAANKO invoice ${invoice.number} total ${invoice.total} EUR\n`,
      'utf8',
    );
    const doc = await this.documents.persistGenerated({
      tenantId,
      entityType: 'customer_invoice',
      entityId: invoice.id,
      filename: `${invoice.number}.pdf`,
      bytes,
      visibility: 'customer',
    });
    console.log(JSON.stringify({ job: 'invoice.pdf', invoiceId: id, tenantId }));
    await this.audit(auth, 'customer_invoice.pdf', id, { documentId: doc.id });
    return { data: { status: 'queued' as const, documentId: doc.id } };
  }

  presentInvoice(row: {
    id: string;
    status: string;
    currency: string;
    subtotal: unknown;
    tax: unknown;
    total: unknown;
    paidAmount: unknown;
    outstanding: unknown;
    number: string;
    customerId: string;
    shipmentId: string | null;
    notes: string | null;
    issuedAt: Date | null;
  }) {
    return {
      ...row,
      subtotal: toMoneyNumber(row.subtotal),
      tax: toMoneyNumber(row.tax),
      total: toMoneyNumber(row.total),
      paidAmount: toMoneyNumber(row.paidAmount),
      outstanding: toMoneyNumber(row.outstanding),
    };
  }

  presentPortalInvoice(row: {
    id: string;
    status: string;
    currency: string;
    total: unknown;
    paidAmount: unknown;
    outstanding: unknown;
    number: string;
    issuedAt: Date | null;
  }) {
    return {
      id: row.id,
      number: row.number,
      status: row.status,
      currency: row.currency,
      total: toMoneyNumber(row.total),
      paidAmount: toMoneyNumber(row.paidAmount),
      outstanding: toMoneyNumber(row.outstanding),
      issuedAt: row.issuedAt,
    };
  }

  private presentMoney<T extends Record<string, unknown>>(row: T) {
    const out: Record<string, unknown> = { ...row };
    for (const key of ['amount', 'rate', 'subtotal', 'tax', 'total', 'paidAmount', 'outstanding']) {
      if (key in out) out[key] = toMoneyNumber(out[key]);
    }
    return out;
  }

  private async requireCustomerInvoice(tenantId: string, id: string) {
    const invoice = await this.prisma.customerInvoice.findFirst({
      where: { id, tenantId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private nextNumber(prefix: string): string {
    return `${prefix}-${newId().slice(-10)}`;
  }

  private async audit(
    auth: AuthContext,
    action: string,
    entityId: string,
    payload: Record<string, unknown>,
  ) {
    const tenantId = requireTenantId(auth);
    await this.prisma.financialAuditLog.create({
      data: {
        id: newId(),
        tenantId,
        actorUserId: auth.userId,
        action,
        entityType: action.split('.')[0] ?? 'finance',
        entityId,
        payload: JSON.parse(JSON.stringify(payload)) as object,
      },
    });
  }
}
