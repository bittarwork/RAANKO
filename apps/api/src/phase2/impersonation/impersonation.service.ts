import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { newId } from '../../common/crypto/token.util';
import type { AuthContext } from '../../common/types/auth-context';

@Injectable()
export class ImpersonationService {
  constructor(private readonly prisma: PrismaService) {}

  async start(auth: AuthContext, tenantId: string, reason?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const session = await this.prisma.impersonationSession.create({
      data: {
        id: newId(),
        platformUserId: auth.userId,
        tenantId,
        reason: reason ?? 'platform_support',
        startedAt: new Date(),
      },
    });

    await this.prisma.platformAuditLog.create({
      data: {
        id: newId(),
        actorUserId: auth.userId,
        tenantId,
        action: 'impersonation.start',
        entityType: 'impersonation_session',
        entityId: session.id,
        payload: { reason: session.reason },
      },
    });

    return {
      data: {
        sessionId: session.id,
        tenantId: session.tenantId,
        startedAt: session.startedAt,
        reason: session.reason,
        headerName: 'X-Raanko-Impersonation',
      },
    };
  }
}
