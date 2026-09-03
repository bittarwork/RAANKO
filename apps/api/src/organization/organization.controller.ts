import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TenantPermissions } from '@raanko/shared';
import { OrganizationService } from './organization.service';
import {
  CreateBranchDto,
  InviteEmployeeDto,
  UpdateBranchDto,
  UpdateCompanySettingsDto,
  UpdateMembershipDto,
} from './dto/organization.dto';
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
export class OrganizationController {
  constructor(private readonly organization: OrganizationService) {}

  @Get('organization/branches')
  @RequirePermission(TenantPermissions.ORG_BRANCHES_VIEW)
  listBranches(@CurrentAuth() auth: AuthContext) {
    return this.organization.listBranches(auth);
  }

  @Post('organization/branches')
  @RequirePermission(TenantPermissions.ORG_BRANCHES_MANAGE)
  createBranch(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateBranchDto,
  ) {
    return this.organization.createBranch(auth, dto);
  }

  @Patch('organization/branches/:id')
  @RequirePermission(TenantPermissions.ORG_BRANCHES_MANAGE)
  updateBranch(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.organization.updateBranch(auth, id, dto);
  }

  @Delete('organization/branches/:id')
  @RequirePermission(TenantPermissions.ORG_BRANCHES_MANAGE)
  archiveBranch(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.organization.archiveBranch(auth, id);
  }

  @Get('organization/employees')
  @RequirePermission(TenantPermissions.ORG_EMPLOYEES_VIEW)
  listEmployees(@CurrentAuth() auth: AuthContext) {
    return this.organization.listEmployees(auth);
  }

  @Post('organization/employees/invite')
  @RequirePermission(TenantPermissions.ORG_EMPLOYEES_MANAGE)
  inviteEmployee(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: InviteEmployeeDto,
  ) {
    return this.organization.inviteEmployee(auth, dto);
  }

  @Patch('organization/employees/:id')
  @RequirePermission(TenantPermissions.ORG_EMPLOYEES_MANAGE)
  updateMembership(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.organization.updateMembership(auth, id, dto);
  }

  @Get('organization/roles')
  @RequirePermission(TenantPermissions.ORG_ROLES_VIEW)
  listRoles(@CurrentAuth() auth: AuthContext) {
    return this.organization.listRoles(auth);
  }

  @Get('organization/settings')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_VIEW)
  getSettings(@CurrentAuth() auth: AuthContext) {
    return this.organization.getSettings(auth);
  }

  @Patch('organization/settings')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  updateSettings(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.organization.updateSettings(auth, dto);
  }
}
