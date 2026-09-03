import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { TenantPermissions } from '@raanko/shared';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/documents.dto';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  Public,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller('documents')
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission(TenantPermissions.DOCUMENTS_VIEW)
  list(
    @CurrentAuth() auth: AuthContext,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.documents.list(auth, entityType, entityId);
  }

  @Post('upload')
  @RequirePermission(TenantPermissions.DOCUMENTS_UPLOAD)
  upload(@CurrentAuth() auth: AuthContext, @Body() dto: UploadDocumentDto) {
    return this.documents.upload(auth, dto);
  }

  @Get(':id')
  @RequirePermission(TenantPermissions.DOCUMENTS_VIEW)
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.documents.get(auth, id);
  }

  @Post(':id/versions')
  @RequirePermission(TenantPermissions.DOCUMENTS_UPLOAD)
  createVersion(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: { storageKey?: string; contentBase64?: string },
  ) {
    return this.documents.createVersion(auth, id, dto);
  }

  @Get(':id/download')
  @RequirePermission(TenantPermissions.DOCUMENTS_DOWNLOAD)
  download(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.documents.createDownloadGrant(auth, id);
  }

  @Get(':id/stream')
  @RequirePermission(TenantPermissions.DOCUMENTS_DOWNLOAD)
  async stream(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.documents.streamAuthorized(auth, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.bytes);
  }
}

@Controller('document-access')
export class DocumentAccessController {
  constructor(private readonly documents: DocumentsService) {}

  @Public()
  @Get(':token')
  async access(@Param('token') token: string, @Res() res: Response) {
    const file = await this.documents.streamByToken(token);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.bytes);
  }
}
