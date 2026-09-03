import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantPermissions } from '@raanko/shared';
import { FinanceService } from './finance.service';
import {
  CreateCreditNoteDto,
  CreateCustomerInvoiceDto,
  CreateExchangeRateDto,
  CreateExpenseDto,
  CreatePaymentDto,
  CreateSupplierInvoiceDto,
} from './dto/finance.dto';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller('finance')
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('invoices')
  @RequirePermission(TenantPermissions.FINANCE_INVOICES_VIEW)
  listInvoices(@CurrentAuth() auth: AuthContext) {
    return this.finance.listCustomerInvoices(auth);
  }

  @Post('invoices')
  @RequirePermission(TenantPermissions.FINANCE_INVOICES_CREATE)
  createInvoice(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateCustomerInvoiceDto,
  ) {
    return this.finance.createCustomerInvoice(auth, dto);
  }

  @Post('invoices/:id/issue')
  @RequirePermission(TenantPermissions.FINANCE_INVOICES_UPDATE)
  issue(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.finance.issueCustomerInvoice(auth, id);
  }

  @Delete('invoices/:id')
  @RequirePermission(TenantPermissions.FINANCE_INVOICES_DELETE)
  remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.finance.deleteCustomerInvoice(auth, id);
  }

  @Post('invoices/:id/pdf')
  @RequirePermission(TenantPermissions.FINANCE_INVOICES_VIEW)
  pdf(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.finance.queueInvoicePdf(auth, id);
  }

  @Get('supplier-invoices')
  @RequirePermission(TenantPermissions.FINANCE_SUPPLIER_INVOICES_VIEW)
  listSupplier(@CurrentAuth() auth: AuthContext) {
    return this.finance.listSupplierInvoices(auth);
  }

  @Post('supplier-invoices')
  @RequirePermission(TenantPermissions.FINANCE_SUPPLIER_INVOICES_MANAGE)
  createSupplier(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSupplierInvoiceDto,
  ) {
    return this.finance.createSupplierInvoice(auth, dto);
  }

  @Get('payments')
  @RequirePermission(TenantPermissions.FINANCE_PAYMENTS_VIEW)
  listPayments(@CurrentAuth() auth: AuthContext) {
    return this.finance.listPayments(auth);
  }

  @Post('payments')
  @RequirePermission(TenantPermissions.FINANCE_PAYMENTS_MANAGE)
  createPayment(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.finance.createPayment(auth, dto);
  }

  @Get('expenses')
  @RequirePermission(TenantPermissions.FINANCE_EXPENSES_VIEW)
  listExpenses(@CurrentAuth() auth: AuthContext) {
    return this.finance.listExpenses(auth);
  }

  @Post('expenses')
  @RequirePermission(TenantPermissions.FINANCE_EXPENSES_MANAGE)
  createExpense(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.finance.createExpense(auth, dto);
  }

  @Post('credit-notes')
  @RequirePermission(TenantPermissions.FINANCE_CREDIT_NOTES_MANAGE)
  creditNote(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateCreditNoteDto,
  ) {
    return this.finance.createCreditNote(auth, dto);
  }

  @Get('exchange-rates')
  @RequirePermission(TenantPermissions.FINANCE_EXCHANGE_RATES_MANAGE)
  listRates(@CurrentAuth() auth: AuthContext) {
    return this.finance.listExchangeRates(auth);
  }

  @Post('exchange-rates')
  @RequirePermission(TenantPermissions.FINANCE_EXCHANGE_RATES_MANAGE)
  upsertRate(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateExchangeRateDto,
  ) {
    return this.finance.upsertExchangeRate(auth, dto);
  }

  @Get('shipments/:id/profitability')
  @RequirePermission(TenantPermissions.FINANCE_PROFITABILITY_VIEW)
  profit(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.finance.shipmentProfitability(auth, id);
  }
}
