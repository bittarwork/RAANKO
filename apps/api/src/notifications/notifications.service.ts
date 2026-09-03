import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import type { AuthContext } from '../common/types/auth-context';
import type {
  DispatchNotificationDto,
  UpdateNotificationPreferenceDto,
} from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async list(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.notification.findMany({
      where: { tenantId, userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
  }

  async markRead(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const existing = await this.prisma.notification.findFirst({
      where: { id, tenantId, userId: auth.userId },
    });
    if (!existing) {
      return { data: null };
    }
    const data = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { data };
  }

  async getPreferences(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.ensurePreferences(tenantId, auth.userId);
    return { data };
  }

  async updatePreferences(
    auth: AuthContext,
    dto: UpdateNotificationPreferenceDto,
  ) {
    const tenantId = requireTenantId(auth);
    await this.ensurePreferences(tenantId, auth.userId);
    const data = await this.prisma.notificationPreference.update({
      where: { tenantId_userId: { tenantId, userId: auth.userId } },
      data: {
        emailEnabled: dto.emailEnabled,
        inAppEnabled: dto.inAppEnabled,
      },
    });
    return { data };
  }

  async dispatch(auth: AuthContext, dto: DispatchNotificationDto) {
    return this.createAndSend(requireTenantId(auth), dto);
  }

  async createAndSend(tenantId: string, dto: DispatchNotificationDto) {
    const prefs = await this.ensurePreferences(tenantId, dto.userId);
    let notification = null;
    if (prefs.inAppEnabled) {
      notification = await this.prisma.notification.create({
        data: {
          id: newId(),
          tenantId,
          userId: dto.userId,
          title: dto.title,
          body: dto.body,
          entityType: dto.entityType,
          entityId: dto.entityId,
        },
      });
    }
    if (prefs.emailEnabled && dto.email) {
      await this.mail.enqueueNotificationEmail({
        to: dto.email,
        title: dto.title,
        body: dto.body,
        tenantId,
      });
    }
    return { data: { notification, dispatched: true } };
  }

  private async ensurePreferences(tenantId: string, userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (existing) return existing;
    return this.prisma.notificationPreference.create({
      data: {
        id: newId(),
        tenantId,
        userId,
        emailEnabled: true,
        inAppEnabled: true,
      },
    });
  }
}
