import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantPermissions } from '@raanko/shared';
import { OperationsService } from './operations.service';
import {
  ChangeShipmentStatusDto,
  CreateBookingDto,
  CreateShipmentDto,
  CreateTrackingEventDto,
} from './dto/operations.dto';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  Public,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';
import { RateLimitService } from '../common/rate-limit/rate-limit.service';

@Controller()
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get('bookings')
  @RequirePermission(TenantPermissions.BOOKINGS_VIEW)
  listBookings(@CurrentAuth() auth: AuthContext) {
    return this.operations.listBookings(auth);
  }

  @Post('bookings')
  @RequirePermission(TenantPermissions.BOOKINGS_CREATE)
  createBooking(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateBookingDto,
  ) {
    return this.operations.createBooking(auth, dto);
  }

  @Get('shipments')
  @RequirePermission(TenantPermissions.SHIPMENTS_VIEW)
  listShipments(@CurrentAuth() auth: AuthContext) {
    return this.operations.listShipments(auth);
  }

  @Post('shipments')
  @RequirePermission(TenantPermissions.SHIPMENTS_CREATE)
  createShipment(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.operations.createShipment(auth, dto);
  }

  @Get('shipments/:id')
  @RequirePermission(TenantPermissions.SHIPMENTS_VIEW)
  getShipment(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.operations.getShipment(auth, id);
  }

  @Post('shipments/:id/status')
  @RequirePermission(TenantPermissions.SHIPMENTS_STATUS_MANAGE)
  changeStatus(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ChangeShipmentStatusDto,
  ) {
    return this.operations.changeStatus(auth, id, dto.status);
  }

  @Post('shipments/:id/events')
  @RequirePermission(TenantPermissions.SHIPMENTS_TRACKING_MANAGE)
  addEvent(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CreateTrackingEventDto,
  ) {
    return this.operations.addTrackingEvent(auth, id, dto);
  }
}

@Controller('public')
export class PublicTrackingController {
  constructor(
    private readonly operations: OperationsService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Public()
  @Get('track/:trackingNumber')
  track(
    @Param('trackingNumber') trackingNumber: string,
    @Query('tenantSlug') tenantSlug: string | undefined,
    @Headers('host') host: string | undefined,
    @Headers('x-forwarded-for') forwarded: string | undefined,
  ) {
    const ip = forwarded?.split(',')[0]?.trim() ?? host ?? 'unknown';
    this.rateLimit.consume(`track:${ip}`, 60, 60_000);
    return this.operations.publicTrack(trackingNumber, tenantSlug, host);
  }
}
