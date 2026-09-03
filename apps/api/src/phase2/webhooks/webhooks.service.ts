import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOpaqueToken, hashToken, newId } from '../../common/crypto/token.util';
import { requireTenantId } from '../../common/utils/require-tenant';
import type { AuthContext } from '../../common/types/auth-context';
import type { CreateWebhookDto, UpdateWebhookDto } from '../dto/phase2.dto';
import { signWebhookPayload } from './webhook-signature';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  async list(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const rows = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows.map((row) => this.present(row)) };
  }

  async create(auth: AuthContext, dto: CreateWebhookDto) {
    const tenantId = requireTenantId(auth);
    const hmacSecret = generateOpaqueToken(32);
    const row = await this.prisma.webhookEndpoint.create({
      data: {
        id: newId(),
        tenantId,
        url: dto.url,
        hmacSecret,
        secretHash: hashToken(hmacSecret),
        events: dto.events,
        isActive: true,
      },
    });
    await this.usage.increment(tenantId, 'webhooks.created');
    return { data: { ...this.present(row), secret: hmacSecret } };
  }

  async update(auth: AuthContext, id: string, dto: UpdateWebhookDto) {
    const row = await this.requireEndpoint(auth, id);
    const updated = await this.prisma.webhookEndpoint.update({
      where: { id: row.id },
      data: {
        ...(dto.url ? { url: dto.url } : {}),
        ...(dto.events ? { events: dto.events } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    return { data: this.present(updated) };
  }

  async remove(auth: AuthContext, id: string) {
    const row = await this.requireEndpoint(auth, id);
    await this.prisma.webhookEndpoint.update({
      where: { id: row.id },
      data: { isActive: false },
    });
    return { data: { ok: true } };
  }

  async enqueue(
    auth: AuthContext,
    endpointId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const endpoint = await this.requireEndpoint(auth, endpointId);
    return this.enqueueForEndpoint(endpoint, eventType, payload);
  }

  async enqueueForEndpoint(
    endpoint: { id: string; hmacSecret: string; url: string; isActive: boolean },
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const body = JSON.stringify(payload);
    const signature = signWebhookPayload(endpoint.hmacSecret, body);
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        id: newId(),
        endpointId: endpoint.id,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        status: endpoint.isActive ? 'delivered' : 'pending',
        attempts: 1,
      },
    });
    this.logger.log(
      `[webhook-delivery] id=${delivery.id} url=${endpoint.url} event=${eventType} sig=${signature} attempts=${delivery.attempts}`,
    );
    return { data: { ...delivery, signature } };
  }

  private async requireEndpoint(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const row = await this.prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Webhook not found');
    return row;
  }

  private present(row: {
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    secretHash: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      url: row.url,
      events: row.events,
      isActive: row.isActive,
      secretHash: row.secretHash,
      createdAt: row.createdAt,
    };
  }
}
