import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthSurface } from '@raanko/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { generateOpaqueToken, hashToken, newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import type { AuthContext } from '../common/types/auth-context';
import type { UploadDocumentDto } from './dto/documents.dto';

const TOKEN_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(auth: AuthContext, entityType?: string, entityId?: string) {
    const tenantId = requireTenantId(auth);
    const visibilityFilter =
      auth.authSurface === AuthSurface.PORTAL ? { visibility: 'customer' as const } : {};
    const data = await this.prisma.document.findMany({
      where: {
        tenantId,
        ...visibilityFilter,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(auth.customerId && auth.authSurface === AuthSurface.PORTAL
          ? {}
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: data.map((row) => this.present(row)) };
  }

  async get(auth: AuthContext, id: string) {
    const doc = await this.requireDocument(auth, id);
    return { data: this.present(doc) };
  }

  async upload(auth: AuthContext, dto: UploadDocumentDto) {
    const tenantId = requireTenantId(auth);
    const bytes = dto.contentBase64
      ? Buffer.from(dto.contentBase64, 'base64')
      : Buffer.from('RAANKO document placeholder\n', 'utf8');
    const safeName = this.safeFilename(dto.filename);
    const storageKey = `tenants/${tenantId}/${newId()}-${safeName}`;
    await this.storage.putObject(storageKey, bytes);

    const data = await this.prisma.document.create({
      data: {
        id: newId(),
        tenantId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        visibility: dto.visibility ?? 'internal',
        storageKey,
        filename: safeName,
        mimeType: dto.mimeType ?? 'application/octet-stream',
        sizeBytes: bytes.length,
        generated: false,
      },
    });
    return { data: this.present(data) };
  }

  async createVersion(
    auth: AuthContext,
    documentId: string,
    dto: { storageKey?: string; contentBase64?: string },
  ) {
    const doc = await this.requireDocument(auth, documentId);
    const latest = await this.prisma.documentVersion.findFirst({
      where: { documentId: doc.id },
      orderBy: { versionNumber: 'desc' },
    });
    const nextNumber = (latest?.versionNumber ?? 0) + 1;
    let storageKey = dto.storageKey;
    if (dto.contentBase64) {
      const bytes = Buffer.from(dto.contentBase64, 'base64');
      storageKey = `tenants/${doc.tenantId}/versions/${newId()}-${this.safeFilename(doc.filename)}`;
      await this.storage.putObject(storageKey, bytes);
    }
    if (!storageKey) {
      storageKey = doc.storageKey;
    }
    const version = await this.prisma.documentVersion.create({
      data: {
        id: newId(),
        documentId: doc.id,
        versionNumber: nextNumber,
        storageKey,
      },
    });
    await this.prisma.document.update({
      where: { id: doc.id },
      data: { storageKey },
    });
    return { data: version };
  }

  async persistGenerated(params: {
    tenantId: string;
    entityType: string;
    entityId: string;
    filename: string;
    mimeType?: string;
    bytes: Buffer;
    visibility?: 'customer' | 'internal';
  }) {
    const storageKey = `tenants/${params.tenantId}/${newId()}-${this.safeFilename(params.filename)}`;
    await this.storage.putObject(storageKey, params.bytes);
    return this.prisma.document.create({
      data: {
        id: newId(),
        tenantId: params.tenantId,
        entityType: params.entityType,
        entityId: params.entityId,
        visibility: params.visibility ?? 'customer',
        storageKey,
        filename: this.safeFilename(params.filename),
        mimeType: params.mimeType ?? 'application/pdf',
        sizeBytes: params.bytes.length,
        generated: true,
      },
    });
  }

  async createDownloadGrant(auth: AuthContext, id: string) {
    const doc = await this.requireDocument(auth, id);
    const raw = generateOpaqueToken(32);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await this.prisma.documentAccessToken.create({
      data: {
        id: newId(),
        tenantId: doc.tenantId,
        documentId: doc.id,
        tokenHash: hashToken(raw),
        expiresAt,
      },
    });
    return {
      data: {
        token: raw,
        expiresAt: expiresAt.toISOString(),
        downloadPath: `/api/v1/document-access/${raw}`,
      },
    };
  }

  async streamAuthorized(auth: AuthContext, id: string) {
    const doc = await this.requireDocument(auth, id);
    const bytes = await this.storage.getObject(doc.storageKey);
    return { bytes, filename: doc.filename, mimeType: doc.mimeType };
  }

  async streamByToken(rawToken: string) {
    const row = await this.prisma.documentAccessToken.findFirst({
      where: { tokenHash: hashToken(rawToken), expiresAt: { gt: new Date() } },
      include: { document: true },
    });
    if (!row) {
      throw new ForbiddenException('Forbidden');
    }
    const bytes = await this.storage.getObject(row.document.storageKey);
    return {
      bytes,
      filename: row.document.filename,
      mimeType: row.document.mimeType,
    };
  }

  async requireDocument(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (auth.authSurface === AuthSurface.PORTAL && doc.visibility !== 'customer') {
      throw new ForbiddenException('Forbidden');
    }
    return doc;
  }

  present(doc: {
    id: string;
    tenantId: string;
    entityType: string;
    entityId: string;
    visibility: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    generated: boolean;
    createdAt: Date;
  }) {
    return {
      id: doc.id,
      entityType: doc.entityType,
      entityId: doc.entityId,
      visibility: doc.visibility,
      filename: doc.filename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      generated: doc.generated,
      createdAt: doc.createdAt,
      storageKey: doc.storageKey,
    };
  }

  private safeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file.bin';
  }
}
