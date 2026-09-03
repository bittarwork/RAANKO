import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuotesService } from '../quotes/quotes.service';
import { DocumentsService } from '../documents/documents.service';
import { FinanceService } from '../finance/finance.service';
import { SupportService } from '../support/support.service';
import { OperationsService } from '../operations/operations.service';
import { requireTenantId } from '../common/utils/require-tenant';
import type { AuthContext } from '../common/types/auth-context';
import type { PortalRfqDto } from '../quotes/dto/quotes.dto';
import type { CreateSupportRequestDto, SupportReplyDto } from '../support/dto/support.dto';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotes: QuotesService,
    private readonly documents: DocumentsService,
    private readonly finance: FinanceService,
    private readonly support: SupportService,
    private readonly operations: OperationsService,
  ) {}

  home(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    return {
      data: {
        tenantName: auth.tenant?.displayName,
        writeMode: auth.tenant?.writeMode,
        canSubmitRfq: auth.tenant?.writeMode === 'full',
        customerId: auth.customerId ?? null,
        tenantId,
      },
    };
  }

  async listQuotes(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const quotes = await this.prisma.quote.findMany({
      where: { tenantId, customerId: auth.customerId, status: { not: 'draft' } },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: quotes.map((q) => this.quotes.presentQuote(auth, q)) };
  }

  async getQuote(auth: AuthContext, id: string) {
    const quote = await this.requireCustomerQuote(auth, id);
    return { data: this.quotes.presentQuote(auth, quote) };
  }

  async acceptQuote(auth: AuthContext, id: string) {
    const quote = await this.requireCustomerQuote(auth, id);
    if (quote.status !== 'sent') {
      throw new BadRequestException('Quote cannot be accepted');
    }
    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: 'accepted' },
      include: { lines: true },
    });
    return { data: this.quotes.presentQuote(auth, updated) };
  }

  async declineQuote(auth: AuthContext, id: string) {
    const quote = await this.requireCustomerQuote(auth, id);
    if (quote.status !== 'sent') {
      throw new BadRequestException('Quote cannot be declined');
    }
    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: 'declined' },
      include: { lines: true },
    });
    return { data: this.quotes.presentQuote(auth, updated) };
  }

  async listShipments(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const shipments = await this.prisma.shipment.findMany({
      where: { tenantId, customerId: auth.customerId },
      include: {
        events: { where: { isPublic: true }, orderBy: { occurredAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: shipments.map((s) => this.operations.toPublicTracking(s)),
    };
  }

  async getShipment(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId, customerId: auth.customerId },
      include: {
        events: { where: { isPublic: true }, orderBy: { occurredAt: 'asc' } },
      },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return { data: this.operations.toPublicTracking(shipment) };
  }

  async listInvoices(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.customerInvoice.findMany({
      where: {
        tenantId,
        customerId: auth.customerId,
        status: { in: ['issued', 'voided'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data.map((row) => this.finance.presentPortalInvoice(row)) };
  }

  async listDocuments(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const [quotes, shipments, invoices] = await Promise.all([
      this.prisma.quote.findMany({
        where: { tenantId, customerId: auth.customerId },
        select: { id: true },
      }),
      this.prisma.shipment.findMany({
        where: { tenantId, customerId: auth.customerId },
        select: { id: true },
      }),
      this.prisma.customerInvoice.findMany({
        where: { tenantId, customerId: auth.customerId },
        select: { id: true },
      }),
    ]);
    const allowed = new Set([
      ...quotes.map((r) => r.id),
      ...shipments.map((r) => r.id),
      ...invoices.map((r) => r.id),
    ]);
    const listed = await this.documents.list(auth);
    return {
      data: listed.data.filter((doc) => allowed.has(doc.entityId)),
    };
  }

  async getDocument(auth: AuthContext, id: string) {
    const listed = await this.listDocuments(auth);
    if (!listed.data.some((doc) => doc.id === id)) {
      throw new NotFoundException('Document not found');
    }
    return this.documents.get(auth, id);
  }

  async downloadDocument(auth: AuthContext, id: string) {
    await this.getDocument(auth, id);
    return this.documents.createDownloadGrant(auth, id);
  }

  async listSupport(auth: AuthContext) {
    if (!auth.customerId) {
      return { data: [] };
    }
    return this.support.listCompanyRequests(auth, auth.customerId);
  }

  async createSupport(auth: AuthContext, dto: CreateSupportRequestDto) {
    if (!auth.customerId) {
      throw new ForbiddenException('Forbidden');
    }
    return this.support.createCompanyRequest(auth, dto, true);
  }

  async replySupport(auth: AuthContext, id: string, dto: SupportReplyDto) {
    return this.support.replyCompanyRequest(auth, id, dto, false);
  }

  async listRfqs(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.quoteRequest.findMany({
      where: { tenantId, customerId: auth.customerId },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  submitRfq(auth: AuthContext, dto: PortalRfqDto) {
    if (auth.tenant?.writeMode !== 'full') {
      throw new ForbiddenException({
        message: 'Tenant is read-only',
        code: 'TENANT_READ_ONLY',
      });
    }
    return this.quotes.submitPortalRfq(auth, dto);
  }

  private async requireCustomerQuote(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId, customerId: auth.customerId },
      include: { lines: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }
}
