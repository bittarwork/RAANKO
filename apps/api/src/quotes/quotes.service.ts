import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import {
  canViewBuyPrices,
  canViewMargins,
  toMoneyNumber,
} from '../common/utils/finance-redaction';
import type { AuthContext } from '../common/types/auth-context';
import type {
  CreateQuoteDto,
  CreateQuoteRequestDto,
  PortalRfqDto,
  UpdateQuoteRequestDto,
} from './dto/quotes.dto';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  async listRfqs(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.quoteRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async createRfq(auth: AuthContext, dto: CreateQuoteRequestDto) {
    const tenantId = requireTenantId(auth);
    if (dto.customerId) {
      await this.requireCustomer(tenantId, dto.customerId);
    }
    const data = await this.prisma.quoteRequest.create({
      data: {
        id: newId(),
        tenantId,
        customerId: dto.customerId,
        origin: dto.origin,
        destination: dto.destination,
        mode: dto.mode,
        cargoDescription: dto.cargoDescription,
        notes: dto.notes,
      },
    });
    return { data };
  }

  async updateRfq(auth: AuthContext, id: string, dto: UpdateQuoteRequestDto) {
    const tenantId = requireTenantId(auth);
    await this.requireRfq(tenantId, id);
    const data = await this.prisma.quoteRequest.update({
      where: { id },
      data: { status: dto.status, notes: dto.notes },
    });
    return { data };
  }

  async submitPortalRfq(auth: AuthContext, dto: PortalRfqDto) {
    const tenantId = requireTenantId(auth);
    if (auth.tenant?.writeMode !== 'full') {
      throw new ForbiddenException({
        message: 'Tenant is read-only',
        code: 'TENANT_READ_ONLY',
      });
    }
    const data = await this.prisma.quoteRequest.create({
      data: {
        id: newId(),
        tenantId,
        customerId: auth.customerId,
        portalAccountId: undefined,
        origin: dto.origin,
        destination: dto.destination,
        mode: dto.mode,
        cargoDescription: dto.cargoDescription,
        notes: dto.notes,
      },
    });
    return { data };
  }

  async listQuotes(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const quotes = await this.prisma.quote.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: quotes.map((q) => this.presentQuote(auth, q)) };
  }

  async getQuote(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const quote = await this.requireQuote(tenantId, id);
    return { data: this.presentQuote(auth, quote) };
  }

  async createQuote(auth: AuthContext, dto: CreateQuoteDto) {
    const tenantId = requireTenantId(auth);
    if (dto.customerId) {
      await this.requireCustomer(tenantId, dto.customerId);
    }
    if (dto.quoteRequestId) {
      await this.requireRfq(tenantId, dto.quoteRequestId);
    }
    const familyId = newId();
    const quote = await this.prisma.quote.create({
      data: {
        id: newId(),
        tenantId,
        quoteFamilyId: familyId,
        versionNumber: 1,
        quoteRequestId: dto.quoteRequestId,
        customerId: dto.customerId,
        currency: dto.currency ?? 'EUR',
        notes: dto.notes,
        status: 'draft',
        lines: {
          create: dto.lines.map((line) => ({
            id: newId(),
            tenantId,
            description: line.description,
            chargeCode: line.chargeCode,
            buyAmount: line.buyAmount,
            sellAmount: line.sellAmount,
          })),
        },
      },
      include: { lines: true },
    });
    if (dto.quoteRequestId) {
      await this.prisma.quoteRequest.update({
        where: { id: dto.quoteRequestId },
        data: { status: 'quoted' },
      });
    }
    return { data: this.presentQuote(auth, quote) };
  }

  async createVersion(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const source = await this.requireQuote(tenantId, id);
    const latest = await this.prisma.quote.findFirst({
      where: { tenantId, quoteFamilyId: source.quoteFamilyId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersion = (latest?.versionNumber ?? source.versionNumber) + 1;
    const quote = await this.prisma.quote.create({
      data: {
        id: newId(),
        tenantId,
        quoteFamilyId: source.quoteFamilyId,
        versionNumber: nextVersion,
        quoteRequestId: source.quoteRequestId,
        customerId: source.customerId,
        currency: source.currency,
        notes: source.notes,
        status: 'draft',
        lines: {
          create: source.lines.map((line) => ({
            id: newId(),
            tenantId,
            description: line.description,
            chargeCode: line.chargeCode,
            buyAmount: line.buyAmount,
            sellAmount: line.sellAmount,
          })),
        },
      },
      include: { lines: true },
    });
    return { data: this.presentQuote(auth, quote) };
  }

  async sendQuote(auth: AuthContext, id: string) {
    return this.setQuoteStatus(auth, id, 'draft', 'sent');
  }

  async acceptQuote(auth: AuthContext, id: string) {
    return this.setQuoteStatus(auth, id, 'sent', 'accepted');
  }

  async declineQuote(auth: AuthContext, id: string) {
    return this.setQuoteStatus(auth, id, 'sent', 'declined');
  }

  async queuePdf(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const quote = await this.requireQuote(tenantId, id);
    const bytes = Buffer.from(
      `RAANKO quote ${quote.id} version ${quote.versionNumber}\n`,
      'utf8',
    );
    const doc = await this.documents.persistGenerated({
      tenantId,
      entityType: 'quote',
      entityId: quote.id,
      filename: `quote-${quote.id}.pdf`,
      bytes,
      visibility: 'customer',
    });
    console.log(
      JSON.stringify({
        job: 'quote.pdf',
        quoteId: quote.id,
        tenantId,
        documentId: doc.id,
      }),
    );
    return { data: { status: 'queued' as const, documentId: doc.id } };
  }

  presentQuote(
    auth: AuthContext,
    quote: {
      lines: Array<{ buyAmount: unknown; sellAmount: unknown } & Record<string, unknown>>;
    } & Record<string, unknown>,
  ) {
    const showBuy = canViewBuyPrices(auth);
    const showMargin = canViewMargins(auth);
    const lines = quote.lines.map((line) => {
      const buyAmount = toMoneyNumber(line.buyAmount);
      const sellAmount = toMoneyNumber(line.sellAmount);
      const presented: Record<string, unknown> = {
        ...line,
        sellAmount,
        buyAmount,
        margin: sellAmount - buyAmount,
      };
      if (!showBuy) delete presented.buyAmount;
      if (!showMargin) delete presented.margin;
      return presented;
    });
    const buyTotal = quote.lines.reduce(
      (sum, line) => sum + toMoneyNumber(line.buyAmount),
      0,
    );
    const sellTotal = quote.lines.reduce(
      (sum, line) => sum + toMoneyNumber(line.sellAmount),
      0,
    );
    const totals: Record<string, unknown> = {
      sellTotal,
      buyTotal,
      margin: sellTotal - buyTotal,
    };
    if (!showBuy) delete totals.buyTotal;
    if (!showMargin) delete totals.margin;
    return { ...quote, lines, totals };
  }

  private async setQuoteStatus(
    auth: AuthContext,
    id: string,
    from: 'draft' | 'sent',
    to: 'sent' | 'accepted' | 'declined',
  ) {
    const tenantId = requireTenantId(auth);
    const quote = await this.requireQuote(tenantId, id);
    if (quote.status !== from) {
      throw new BadRequestException(
        `Quote cannot move from ${quote.status} to ${to}`,
      );
    }
    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: to },
      include: { lines: true },
    });
    return { data: this.presentQuote(auth, updated) };
  }

  private async requireQuote(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  private async requireRfq(tenantId: string, id: string) {
    const rfq = await this.prisma.quoteRequest.findFirst({
      where: { id, tenantId },
    });
    if (!rfq) throw new NotFoundException('Quote request not found');
    return rfq;
  }

  private async requireCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
