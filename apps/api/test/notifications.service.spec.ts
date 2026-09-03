import { describe, it, expect, vi } from 'vitest';
import { AuthSurface } from '@raanko/shared';
import { NotificationsService } from '../src/notifications/notifications.service';
import type { AuthContext } from '../src/common/types/auth-context';

describe('NotificationsService', () => {
  it('creates an in-app notification and dispatches email', async () => {
    const prisma = {
      notification: { create: vi.fn().mockResolvedValue({ id: 'n1' }) },
      notificationPreference: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          inAppEnabled: true,
          emailEnabled: true,
        }),
      },
    };
    const mail = { enqueueNotificationEmail: vi.fn().mockResolvedValue(undefined) };
    const service = new NotificationsService(prisma as never, mail as never);
    const result = await service.createAndSend('tenant-a', {
      userId: 'u1',
      email: 'ops@acme.test',
      title: 'Quote sent',
      body: 'A quote is ready',
      entityType: 'quote',
      entityId: 'q1',
    });
    expect(result.data.dispatched).toBe(true);
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(mail.enqueueNotificationEmail).toHaveBeenCalledWith({
      to: 'ops@acme.test',
      title: 'Quote sent',
      body: 'A quote is ready',
      tenantId: 'tenant-a',
    });
  });

  it('lists only the current user feed', async () => {
    const prisma = {
      notification: {
        findMany: vi.fn().mockResolvedValue([{ id: 'n1' }]),
      },
    };
    const service = new NotificationsService(prisma as never, {
      enqueueNotificationEmail: vi.fn(),
    } as never);
    const auth: AuthContext = {
      userId: 'u1',
      sessionId: 's1',
      authSurface: AuthSurface.COMPANY,
      email: 'ops@acme.test',
      permissions: new Set(),
      tenant: {
        tenantId: 'tenant-a',
        tenantSlug: 'acme',
        writeMode: 'full',
        subscriptionStatus: 'active',
        entitlements: new Set(),
        displayName: 'Acme',
      },
    };
    await service.list(auth);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-a', userId: 'u1' },
      }),
    );
  });
});
