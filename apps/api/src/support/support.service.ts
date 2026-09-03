import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import type { AuthContext } from '../common/types/auth-context';
import type {
  CreateRaankoTicketDto,
  CreateSupportRequestDto,
  SupportReplyDto,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listCompanyRequests(auth: AuthContext, customerId?: string) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.companySupportRequest.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async createCompanyRequest(
    auth: AuthContext,
    dto: CreateSupportRequestDto,
    asCustomer: boolean,
  ) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.companySupportRequest.create({
      data: {
        id: newId(),
        tenantId,
        customerId: asCustomer ? auth.customerId : dto.customerId,
        subject: dto.subject,
        body: dto.body,
        entityType: dto.entityType,
        entityId: dto.entityId,
        createdByUserId: auth.userId,
      },
      include: { messages: true },
    });
    return { data };
  }

  async replyCompanyRequest(
    auth: AuthContext,
    id: string,
    dto: SupportReplyDto,
    isStaff: boolean,
  ) {
    const tenantId = requireTenantId(auth);
    const request = await this.prisma.companySupportRequest.findFirst({
      where: {
        id,
        tenantId,
        ...(auth.customerId && !isStaff ? { customerId: auth.customerId } : {}),
      },
    });
    if (!request) throw new NotFoundException('Support request not found');
    const message = await this.prisma.companySupportMessage.create({
      data: {
        id: newId(),
        tenantId,
        requestId: id,
        authorUserId: auth.userId,
        isStaff,
        body: dto.body,
      },
    });
    await this.prisma.companySupportRequest.update({
      where: { id },
      data: { status: isStaff ? 'in_progress' : request.status },
    });
    return { data: message };
  }

  async listRaankoTicketsForTenant(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.raankoSupportTicket.findMany({
      where: { tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async createRaankoTicket(auth: AuthContext, dto: CreateRaankoTicketDto) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.raankoSupportTicket.create({
      data: {
        id: newId(),
        tenantId,
        subject: dto.subject,
        body: dto.body,
        entityType: dto.entityType,
        entityId: dto.entityId,
        createdByUserId: auth.userId,
      },
      include: { messages: true },
    });
    return { data };
  }

  async listRaankoTicketsPlatform() {
    const data = await this.prisma.raankoSupportTicket.findMany({
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async replyRaankoTicket(
    ticketId: string,
    dto: SupportReplyDto,
    authorUserId: string,
    isPlatform: boolean,
    tenantId?: string,
  ) {
    const ticket = await this.prisma.raankoSupportTicket.findFirst({
      where: {
        id: ticketId,
        ...(tenantId ? { tenantId } : {}),
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const message = await this.prisma.raankoSupportMessage.create({
      data: {
        id: newId(),
        tenantId: ticket.tenantId,
        ticketId,
        authorUserId,
        isPlatform,
        body: dto.body,
      },
    });
    await this.prisma.raankoSupportTicket.update({
      where: { id: ticketId },
      data: { status: isPlatform ? 'in_progress' : ticket.status },
    });
    await this.notifications.createAndSend(ticket.tenantId, {
      userId: ticket.createdByUserId ?? authorUserId,
      title: 'RAANKO support update',
      body: dto.body,
      entityType: 'raanko_support_ticket',
      entityId: ticketId,
    });
    return { data: message };
  }
}
