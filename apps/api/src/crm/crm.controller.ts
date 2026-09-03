import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { TenantPermissions } from '@raanko/shared';
import { CrmService } from './crm.service';
import {
  CreateCustomerActivityDto,
  CreateCustomerDto,
  ImportCustomersDto,
  PaginationQueryDto,
  UpdateCustomerDto,
} from './dto/crm.dto';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller('crm')
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('customers')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_VIEW)
  list(
    @CurrentAuth() auth: AuthContext,
    @Query() query: PaginationQueryDto,
  ) {
    return this.crm.list(auth, query.page, query.pageSize, query.search);
  }

  @Post('customers')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_CREATE)
  create(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.crm.create(auth, dto);
  }

  @Get('customers/export')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_EXPORT)
  export(@CurrentAuth() auth: AuthContext) {
    return this.crm.exportRows(auth);
  }

  @Get('customers/export.csv')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_EXPORT)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@CurrentAuth() auth: AuthContext, @Res() res: Response) {
    const csv = await this.crm.exportCsv(auth);
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  }

  @Post('customers/import')
  @RequirePermission(TenantPermissions.IMPORTS_JOBS_RUN)
  importRows(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ImportCustomersDto,
  ) {
    return this.crm.importRows(auth, dto.rows);
  }

  @Get('customers/:id')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_VIEW)
  get(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.crm.get(auth, id);
  }

  @Patch('customers/:id')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_UPDATE)
  update(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.crm.update(auth, id, dto);
  }

  @Delete('customers/:id')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_DELETE)
  remove(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.crm.softDelete(auth, id);
  }

  @Get('customers/:id/activities')
  @RequirePermission(TenantPermissions.CRM_CUSTOMERS_VIEW)
  listActivities(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.crm.listActivities(auth, id);
  }

  @Post('customers/:id/activities')
  @RequirePermission(TenantPermissions.CRM_ACTIVITIES_MANAGE)
  addActivity(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateCustomerActivityDto,
  ) {
    return this.crm.addActivity(auth, id, dto);
  }
}
