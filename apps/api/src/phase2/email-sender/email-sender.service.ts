import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { requireTenantId } from '../../common/utils/require-tenant';
import { newId } from '../../common/crypto/token.util';
import type { AuthContext } from '../../common/types/auth-context';
import type { UpsertEmailSenderDto } from '../dto/phase2.dto';

@Injectable()
export class EmailSenderService {
  constructor(private readonly prisma: PrismaService) {}

  async get(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.tenantEmailSender.findUnique({
      where: { tenantId },
    });
    return { data };
  }

  async upsert(auth: AuthContext, dto: UpsertEmailSenderDto) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.tenantEmailSender.upsert({
      where: { tenantId },
      create: {
        id: newId(),
        tenantId,
        fromEmail: dto.fromEmail.toLowerCase(),
        fromName: dto.fromName,
        verified: dto.verified ?? false,
      },
      update: {
        fromEmail: dto.fromEmail.toLowerCase(),
        fromName: dto.fromName,
        ...(dto.verified !== undefined ? { verified: dto.verified } : {}),
      },
    });
    return { data };
  }
}
