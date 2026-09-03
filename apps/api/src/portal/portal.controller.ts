import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalRfqDto } from '../quotes/dto/quotes.dto';
import {
  CreateSupportRequestDto,
  SupportReplyDto,
} from '../support/dto/support.dto';
import { PortalAuthGuard } from '../common/guards/auth.guards';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import { CurrentAuth } from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller('portal')
@UseGuards(PortalAuthGuard, TenantWriteModeGuard)
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get('home')
  home(@CurrentAuth() auth: AuthContext) {
    return this.portal.home(auth);
  }

  @Get('quotes')
  quotes(@CurrentAuth() auth: AuthContext) {
    return this.portal.listQuotes(auth);
  }

  @Get('quotes/:id')
  quote(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.portal.getQuote(auth, id);
  }

  @Post('quotes/:id/accept')
  accept(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.portal.acceptQuote(auth, id);
  }

  @Post('quotes/:id/decline')
  decline(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.portal.declineQuote(auth, id);
  }

  @Get('shipments')
  shipments(@CurrentAuth() auth: AuthContext) {
    return this.portal.listShipments(auth);
  }

  @Get('shipments/:id')
  shipment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.portal.getShipment(auth, id);
  }

  @Get('invoices')
  invoices(@CurrentAuth() auth: AuthContext) {
    return this.portal.listInvoices(auth);
  }

  @Get('documents')
  documents(@CurrentAuth() auth: AuthContext) {
    return this.portal.listDocuments(auth);
  }

  @Get('documents/:id')
  document(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.portal.getDocument(auth, id);
  }

  @Get('documents/:id/download')
  download(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.portal.downloadDocument(auth, id);
  }

  @Get('support')
  support(@CurrentAuth() auth: AuthContext) {
    return this.portal.listSupport(auth);
  }

  @Post('support')
  createSupport(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSupportRequestDto,
  ) {
    return this.portal.createSupport(auth, dto);
  }

  @Post('support/:id/reply')
  replySupport(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: SupportReplyDto,
  ) {
    return this.portal.replySupport(auth, id, dto);
  }

  @Get('rfq')
  listRfq(@CurrentAuth() auth: AuthContext) {
    return this.portal.listRfqs(auth);
  }

  @Post('rfq')
  submitRfq(@CurrentAuth() auth: AuthContext, @Body() dto: PortalRfqDto) {
    return this.portal.submitRfq(auth, dto);
  }
}
