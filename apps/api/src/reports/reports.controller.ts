import {
  Controller,
  Get,
  Header,
  Post,
  Query,
  UseGuards,
  Body,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { IsOptional, IsString } from 'class-validator';
import { TenantPermissions } from '@raanko/shared';
import { ReportsService } from './reports.service';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

class ExportReportDto {
  @IsOptional()
  @IsString()
  kind?: string;
}

@Controller()
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('reports/dashboard')
  @RequirePermission(TenantPermissions.REPORTS_DASHBOARD_VIEW)
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.reports.dashboard(auth);
  }

  @Get('reports/operational')
  @RequirePermission(TenantPermissions.REPORTS_OPERATIONAL_VIEW)
  operational(@CurrentAuth() auth: AuthContext) {
    return this.reports.operational(auth);
  }

  @Get('reports/financial')
  @RequirePermission(TenantPermissions.FINANCE_REPORTS_VIEW)
  financial(@CurrentAuth() auth: AuthContext) {
    return this.reports.financial(auth);
  }

  @Post('reports/export')
  @RequirePermission(TenantPermissions.REPORTS_OPERATIONAL_EXPORT)
  export(@CurrentAuth() auth: AuthContext, @Body() dto: ExportReportDto) {
    return this.reports.queueExport(auth, dto.kind ?? 'operational');
  }

  @Get('reports/export.csv')
  @RequirePermission(TenantPermissions.REPORTS_OPERATIONAL_EXPORT)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@CurrentAuth() auth: AuthContext, @Res() res: Response) {
    const csv = await this.reports.exportCsv(auth);
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send(csv);
  }

  @Get('search')
  @RequirePermission(TenantPermissions.SEARCH_TENANT_USE)
  search(@CurrentAuth() auth: AuthContext, @Query('q') q: string) {
    return this.reports.search(auth, q ?? '');
  }
}
