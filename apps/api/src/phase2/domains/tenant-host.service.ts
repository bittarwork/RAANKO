import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractTenantSlugFromHost } from '../../common/guards/auth.guards';

/** Resolves a tenant from subdomain slug or a verified custom hostname. */
@Injectable()
export class TenantHostService {
  constructor(private readonly prisma: PrismaService) {}

  parseHostname(host?: string): string | null {
    if (!host) return null;
    return host.split(':')[0]?.toLowerCase() ?? null;
  }

  async findVerifiedDomain(hostname: string) {
    return this.prisma.tenantCustomDomain.findFirst({
      where: {
        hostname,
        status: 'verified',
        verifiedAt: { not: null },
      },
    });
  }

  async resolveTenant(host?: string, slugHint?: string) {
    const hostname = this.parseHostname(host);
    if (hostname) {
      const custom = await this.findVerifiedDomain(hostname);
      if (custom) {
        return this.prisma.tenant.findUnique({ where: { id: custom.tenantId } });
      }
    }
    const slug = extractTenantSlugFromHost(host) ?? slugHint?.toLowerCase();
    if (!slug) return null;
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async hostnameBelongsToTenant(
    host: string | undefined,
    tenantId: string,
  ): Promise<boolean> {
    const hostname = this.parseHostname(host);
    if (!hostname) return false;
    const custom = await this.prisma.tenantCustomDomain.findFirst({
      where: {
        tenantId,
        hostname,
        status: 'verified',
        verifiedAt: { not: null },
      },
    });
    return Boolean(custom);
  }
}
