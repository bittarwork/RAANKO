import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface InvitationEmailPayload {
  to: string;
  tenantName: string;
  inviteUrl: string;
  kind: 'owner' | 'employee';
  tenantId?: string;
}

export interface NotificationEmailPayload {
  to: string;
  title: string;
  body?: string;
  tenantId?: string;
}

const PLATFORM_FROM = {
  fromEmail: 'noreply@raanko.local',
  fromName: 'RAANKO',
};

/**
 * MVP mailer stub — logs invitation emails when Resend is not configured.
 * Uses a verified tenant sender when present, otherwise the platform default.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveFrom(tenantId?: string): Promise<{ fromEmail: string; fromName: string }> {
    if (!tenantId) return PLATFORM_FROM;
    const sender = await this.prisma.tenantEmailSender.findUnique({
      where: { tenantId },
    });
    if (sender?.verified) {
      return { fromEmail: sender.fromEmail, fromName: sender.fromName };
    }
    return PLATFORM_FROM;
  }

  async enqueueInvitationEmail(payload: InvitationEmailPayload): Promise<void> {
    const from = await this.resolveFrom(payload.tenantId);
    this.logger.log(
      `[invitation-email] from=${from.fromEmail} (${from.fromName}) kind=${payload.kind} to=${payload.to} tenant=${payload.tenantName} url=${payload.inviteUrl}`,
    );
  }

  async enqueueNotificationEmail(payload: NotificationEmailPayload): Promise<void> {
    const from = await this.resolveFrom(payload.tenantId);
    this.logger.log(
      `[notification-email] from=${from.fromEmail} to=${payload.to} title=${payload.title}`,
    );
  }
}
