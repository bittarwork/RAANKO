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
import { NotificationsService } from './notifications.service';
import {
  DispatchNotificationDto,
  UpdateNotificationPreferenceDto,
} from './dto/notifications.dto';
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
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  list(@CurrentAuth() auth: AuthContext) {
    return this.notifications.list(auth);
  }

  @Post('notifications/:id/read')
  markRead(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.notifications.markRead(auth, id);
  }

  @Get('notification-preferences')
  prefs(@CurrentAuth() auth: AuthContext) {
    return this.notifications.getPreferences(auth);
  }

  @Patch('notification-preferences')
  @RequirePermission(TenantPermissions.SETTINGS_NOTIFICATIONS_MANAGE)
  updatePrefs(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.notifications.updatePreferences(auth, dto);
  }

  @Post('notifications/dispatch')
  @RequirePermission(TenantPermissions.SETTINGS_NOTIFICATIONS_MANAGE)
  dispatch(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: DispatchNotificationDto,
  ) {
    return this.notifications.dispatch(auth, dto);
  }
}
