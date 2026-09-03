import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformPermissions, TenantPermissions } from '@raanko/shared';
import { SupportService } from './support.service';
import {
  CreateRaankoTicketDto,
  CreateSupportRequestDto,
  SupportReplyDto,
} from './dto/support.dto';
import {
  CompanyAuthGuard,
  PlatformAuthGuard,
} from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import { requireTenantId } from '../common/utils/require-tenant';
import type { AuthContext } from '../common/types/auth-context';

@Controller('support')
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class CompanySupportController {
  constructor(private readonly support: SupportService) {}

  @Get('requests')
  @RequirePermission(TenantPermissions.SUPPORT_COMPANY_REQUESTS_VIEW)
  listRequests(@CurrentAuth() auth: AuthContext) {
    return this.support.listCompanyRequests(auth);
  }

  @Post('requests/:id/reply')
  @RequirePermission(TenantPermissions.SUPPORT_COMPANY_REQUESTS_MANAGE)
  replyRequest(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: SupportReplyDto,
  ) {
    return this.support.replyCompanyRequest(auth, id, dto, true);
  }

  @Get('raanko-tickets')
  @RequirePermission(TenantPermissions.SUPPORT_RAANKO_TICKETS_VIEW)
  listTickets(@CurrentAuth() auth: AuthContext) {
    return this.support.listRaankoTicketsForTenant(auth);
  }

  @Post('raanko-tickets')
  @RequirePermission(TenantPermissions.SUPPORT_RAANKO_TICKETS_CREATE)
  createTicket(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateRaankoTicketDto,
  ) {
    return this.support.createRaankoTicket(auth, dto);
  }

  @Post('raanko-tickets/:id/reply')
  @RequirePermission(TenantPermissions.SUPPORT_RAANKO_TICKETS_CREATE)
  replyTicket(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: SupportReplyDto,
  ) {
    return this.support.replyRaankoTicket(
      id,
      dto,
      auth.userId,
      false,
      requireTenantId(auth),
    );
  }
}

@Controller('platform/support/tickets')
@UseGuards(PlatformAuthGuard, PermissionGuard)
export class PlatformSupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  @RequirePermission(PlatformPermissions.SUPPORT_VIEW)
  list() {
    return this.support.listRaankoTicketsPlatform();
  }

  @Post(':id/reply')
  @RequirePermission(PlatformPermissions.SUPPORT_MANAGE)
  reply(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: SupportReplyDto,
  ) {
    return this.support.replyRaankoTicket(id, dto, auth.userId, true);
  }
}

@Controller('support')
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class CompanySupportCreateController {
  constructor(private readonly support: SupportService) {}

  @Post('requests')
  @RequirePermission(TenantPermissions.SUPPORT_COMPANY_REQUESTS_MANAGE)
  createInternal(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSupportRequestDto,
  ) {
    return this.support.createCompanyRequest(auth, dto, false);
  }
}
