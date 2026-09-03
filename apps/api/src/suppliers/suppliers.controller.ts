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
import { SuppliersService } from './suppliers.service';
import {
  CreateChargeTemplateDto,
  CreateRateSheetDto,
  CreateSupplierDto,
  ImportRatesDto,
  UpdateSupplierDto,
} from './dto/suppliers.dto';
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
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get('suppliers')
  @RequirePermission(TenantPermissions.SUPPLIERS_VIEW)
  list(@CurrentAuth() auth: AuthContext) {
    return this.suppliers.listSuppliers(auth);
  }

  @Post('suppliers')
  @RequirePermission(TenantPermissions.SUPPLIERS_MANAGE)
  create(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliers.createSupplier(auth, dto);
  }

  @Patch('suppliers/:id')
  @RequirePermission(TenantPermissions.SUPPLIERS_MANAGE)
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliers.updateSupplier(auth, id, dto);
  }

  @Get('rate-sheets')
  @RequirePermission(TenantPermissions.SUPPLIERS_RATES_VIEW)
  listSheets(@CurrentAuth() auth: AuthContext) {
    return this.suppliers.listRateSheets(auth);
  }

  @Post('rate-sheets')
  @RequirePermission(TenantPermissions.SUPPLIERS_RATES_MANAGE)
  createSheet(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateRateSheetDto,
  ) {
    return this.suppliers.createRateSheet(auth, dto);
  }

  @Post('rate-sheets/import')
  @RequirePermission(TenantPermissions.SUPPLIERS_RATES_IMPORT)
  importRates(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ImportRatesDto,
  ) {
    return this.suppliers.importRates(auth, dto.rows);
  }

  @Get('charge-templates')
  @RequirePermission(TenantPermissions.SUPPLIERS_RATES_VIEW)
  listCharges(@CurrentAuth() auth: AuthContext) {
    return this.suppliers.listChargeTemplates(auth);
  }

  @Post('charge-templates')
  @RequirePermission(TenantPermissions.SUPPLIERS_RATES_MANAGE)
  createCharge(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateChargeTemplateDto,
  ) {
    return this.suppliers.createChargeTemplate(auth, dto);
  }
}
