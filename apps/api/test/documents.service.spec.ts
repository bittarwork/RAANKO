import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthSurface } from '@raanko/shared';
import { DocumentsService } from '../src/documents/documents.service';
import type { AuthContext } from '../src/common/types/auth-context';

function companyAuth(tenantId = 'tenant-a'): AuthContext {
  return {
    userId: 'u1',
    sessionId: 's1',
    authSurface: AuthSurface.COMPANY,
    email: 'ops@acme.test',
    permissions: new Set(),
    tenant: {
      tenantId,
      tenantSlug: 'acme',
      writeMode: 'full',
      subscriptionStatus: 'active',
      entitlements: new Set(),
      displayName: 'Acme',
    },
  };
}

describe('DocumentsService', () => {
  let prisma: {
    document: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    documentAccessToken: { create: ReturnType<typeof vi.fn> };
  };
  let storage: { putObject: ReturnType<typeof vi.fn>; getObject: ReturnType<typeof vi.fn> };
  let service: DocumentsService;

  beforeEach(() => {
    prisma = {
      document: { findFirst: vi.fn(), create: vi.fn() },
      documentAccessToken: { create: vi.fn() },
    };
    storage = {
      putObject: vi.fn().mockResolvedValue(undefined),
      getObject: vi.fn().mockResolvedValue(Buffer.from('pdf')),
    };
    service = new DocumentsService(prisma as never, storage as never);
  });

  it('rejects unauthorized download when document is missing', async () => {
    prisma.document.findFirst.mockResolvedValue(null);
    await expect(
      service.createDownloadGrant(companyAuth(), 'doc-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects cross-tenant download', async () => {
    prisma.document.findFirst.mockResolvedValue(null);
    await expect(
      service.createDownloadGrant(companyAuth('tenant-b'), 'doc-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.document.findFirst).toHaveBeenCalledWith({
      where: { id: 'doc-a', tenantId: 'tenant-b' },
    });
  });

  it('returns a signed download path instead of a bucket URL', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-a',
      visibility: 'internal',
      storageKey: 'tenants/tenant-a/file.pdf',
      filename: 'file.pdf',
      mimeType: 'application/pdf',
    });
    prisma.documentAccessToken.create.mockResolvedValue({});
    const result = await service.createDownloadGrant(companyAuth(), 'doc-1');
    expect(result.data.token).toBeTruthy();
    expect(result.data.downloadPath).toContain('/api/v1/document-access/');
    expect(result.data.downloadPath).not.toMatch(/^https?:\/\//);
  });

  it('hides internal documents from portal users', async () => {
    prisma.document.findFirst.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-a',
      visibility: 'internal',
    });
    const portal: AuthContext = {
      ...companyAuth(),
      authSurface: AuthSurface.PORTAL,
      customerId: 'cust-1',
    };
    await expect(service.get(portal, 'doc-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
