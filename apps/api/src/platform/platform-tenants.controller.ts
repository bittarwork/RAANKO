import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformPermissions } from '@raanko/shared';
import { PlatformTenantsService } from './platform-tenants.service';
import { CreateTenantDto, ExtendTrialDto } from './dto/tenant.dto';
import { PlatformAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller('platform/tenants')
@UseGuards(PlatformAuthGuard, PermissionGuard)
export class PlatformTenantsController {
  constructor(private readonly tenants: PlatformTenantsService) {}

  @Get()
  @RequirePermission(PlatformPermissions.TENANTS_VIEW)
  list() {
    return this.tenants.listTenants();
  }

  @Get(':id')
  @RequirePermission(PlatformPermissions.TENANTS_VIEW)
  get(@Param('id') id: string) {
    return this.tenants.getTenant(id);
  }

  @Post()
  @RequirePermission(PlatformPermissions.TENANTS_CREATE)
  create(
    @Body() dto: CreateTenantDto,
    @CurrentAuth() auth: AuthContext,
  ) {
    return this.tenants.provisionTenant(dto, auth.userId);
  }

  @Post(':id/activate')
  @RequirePermission(PlatformPermissions.TENANTS_UPDATE)
  activate(@Param('id') id: string) {
    return this.tenants.activate(id);
  }

  @Post(':id/suspend')
  @RequirePermission(PlatformPermissions.TENANTS_SUSPEND)
  suspend(@Param('id') id: string) {
    return this.tenants.suspend(id);
  }

  @Post(':id/read-only')
  @RequirePermission(PlatformPermissions.TENANTS_UPDATE)
  setReadOnly(@Param('id') id: string) {
    return this.tenants.setReadOnly(id);
  }

  @Post(':id/extend-trial')
  @RequirePermission(PlatformPermissions.SUBSCRIPTIONS_MANAGE)
  extendTrial(@Param('id') id: string, @Body() dto: ExtendTrialDto) {
    return this.tenants.extendTrial(id, dto.days ?? 30);
  }
}
