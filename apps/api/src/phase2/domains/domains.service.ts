import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { newId } from '../../common/crypto/token.util';
import { requireTenantId } from '../../common/utils/require-tenant';
import type { AuthContext } from '../../common/types/auth-context';

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTenant(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.tenantCustomDomain.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async upsertForCompany(auth: AuthContext, hostname: string) {
    return this.upsert(requireTenantId(auth), hostname);
  }

  async upsertForPlatform(tenantId: string, hostname: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.upsert(tenantId, hostname);
  }

  async verifyPlatform(tenantId: string, domainId: string) {
    const row = await this.prisma.tenantCustomDomain.findFirst({
      where: { id: domainId, tenantId },
    });
    if (!row) throw new NotFoundException('Domain not found');
    const data = await this.prisma.tenantCustomDomain.update({
      where: { id: row.id },
      data: { status: 'verified', verifiedAt: new Date() },
    });
    return { data };
  }

  private async upsert(tenantId: string, rawHostname: string) {
    const hostname = rawHostname.trim().toLowerCase();
    const clash = await this.prisma.tenantCustomDomain.findUnique({
      where: { hostname },
    });
    if (clash && clash.tenantId !== tenantId) {
      throw new ConflictException('Hostname already in use');
    }
    const existing = await this.prisma.tenantCustomDomain.findFirst({
      where: { tenantId, hostname },
    });
    const data = existing
      ? await this.prisma.tenantCustomDomain.update({
          where: { id: existing.id },
          data: { hostname, status: 'pending', verifiedAt: null },
        })
      : await this.prisma.tenantCustomDomain.create({
          data: {
            id: newId(),
            tenantId,
            hostname,
            status: 'pending',
          },
        });
    return { data };
  }
}
