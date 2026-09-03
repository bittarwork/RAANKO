import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantPermissions } from '@raanko/shared';
import { QuotesService } from './quotes.service';
import {
  CreateQuoteDto,
  CreateQuoteRequestDto,
  UpdateQuoteRequestDto,
} from './dto/quotes.dto';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller()
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get('quote-requests')
  @RequirePermission(TenantPermissions.QUOTES_RFQ_VIEW)
  listRfqs(@CurrentAuth() auth: AuthContext) {
    return this.quotes.listRfqs(auth);
  }

  @Post('quote-requests')
  @RequirePermission(TenantPermissions.QUOTES_RFQ_MANAGE)
  createRfq(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateQuoteRequestDto,
  ) {
    return this.quotes.createRfq(auth, dto);
  }

  @Patch('quote-requests/:id')
  @RequirePermission(TenantPermissions.QUOTES_RFQ_MANAGE)
  updateRfq(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteRequestDto,
  ) {
    return this.quotes.updateRfq(auth, id, dto);
  }

  @Get('quotes')
  @RequirePermission(TenantPermissions.QUOTES_VIEW)
  listQuotes(@CurrentAuth() auth: AuthContext) {
    return this.quotes.listQuotes(auth);
  }

  @Post('quotes')
  @RequirePermission(TenantPermissions.QUOTES_CREATE)
  createQuote(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotes.createQuote(auth, dto);
  }

  @Get('quotes/:id')
  @RequirePermission(TenantPermissions.QUOTES_VIEW)
  getQuote(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.quotes.getQuote(auth, id);
  }

  @Post('quotes/:id/versions')
  @RequirePermission(TenantPermissions.QUOTES_CREATE)
  createVersion(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.quotes.createVersion(auth, id);
  }

  @Post('quotes/:id/send')
  @RequirePermission(TenantPermissions.QUOTES_APPROVE)
  send(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.quotes.sendQuote(auth, id);
  }

  @Post('quotes/:id/accept')
  @RequirePermission(TenantPermissions.QUOTES_APPROVE)
  accept(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.quotes.acceptQuote(auth, id);
  }

  @Post('quotes/:id/decline')
  @RequirePermission(TenantPermissions.QUOTES_APPROVE)
  decline(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.quotes.declineQuote(auth, id);
  }

  @Post('quotes/:id/pdf')
  @RequirePermission(TenantPermissions.QUOTES_VIEW)
  pdf(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.quotes.queuePdf(auth, id);
  }
}
