import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlatformPermissions, TenantPermissions } from '@raanko/shared';
import { CompanyAuthGuard, PlatformAuthGuard } from '../common/guards/auth.guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { TenantWriteModeGuard } from '../common/guards/tenant-write-mode.guard';
import {
  CurrentAuth,
  RequirePermission,
} from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';
import { DomainsService } from './domains/domains.service';
import { EmailSenderService } from './email-sender/email-sender.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { UsageService } from './usage/usage.service';
import { BillingService } from './billing/billing.service';
import { ImpersonationService } from './impersonation/impersonation.service';
import { ConsolidationsService } from './consolidations/consolidations.service';
import {
  CreateConsolidationDto,
  CreateWebhookDto,
  ImpersonateDto,
  PatchPlanDto,
  UpdateWebhookDto,
  UpsertCustomDomainDto,
  UpsertEmailSenderDto,
} from './dto/phase2.dto';

@Controller()
@UseGuards(CompanyAuthGuard, PermissionGuard, TenantWriteModeGuard)
export class Phase2CompanyController {
  constructor(
    private readonly domains: DomainsService,
    private readonly emailSender: EmailSenderService,
    private readonly webhooks: WebhooksService,
    private readonly usage: UsageService,
    private readonly billing: BillingService,
    private readonly consolidations: ConsolidationsService,
  ) {}

  @Get('settings/domains')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_VIEW)
  listDomains(@CurrentAuth() auth: AuthContext) {
    return this.domains.listForTenant(auth);
  }

  @Post('settings/domains')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  setDomain(@CurrentAuth() auth: AuthContext, @Body() dto: UpsertCustomDomainDto) {
    return this.domains.upsertForCompany(auth, dto.hostname);
  }

  @Get('settings/email-sender')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_VIEW)
  getEmailSender(@CurrentAuth() auth: AuthContext) {
    return this.emailSender.get(auth);
  }

  @Patch('settings/email-sender')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  upsertEmailSender(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: UpsertEmailSenderDto,
  ) {
    return this.emailSender.upsert(auth, dto);
  }

  @Get('webhooks')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_VIEW)
  listWebhooks(@CurrentAuth() auth: AuthContext) {
    return this.webhooks.list(auth);
  }

  @Post('webhooks')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  createWebhook(@CurrentAuth() auth: AuthContext, @Body() dto: CreateWebhookDto) {
    return this.webhooks.create(auth, dto);
  }

  @Patch('webhooks/:id')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  updateWebhook(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooks.update(auth, id, dto);
  }

  @Delete('webhooks/:id')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  removeWebhook(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.webhooks.remove(auth, id);
  }

  @Post('webhooks/:id/deliveries')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_MANAGE)
  enqueueDelivery(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() body: { eventType?: string; payload?: Record<string, unknown> },
  ) {
    return this.webhooks.enqueue(
      auth,
      id,
      body.eventType ?? 'ping',
      body.payload ?? { ok: true },
    );
  }

  @Get('usage')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_VIEW)
  companyUsage(@CurrentAuth() auth: AuthContext) {
    return this.usage.companyUsage(auth);
  }

  @Get('billing/subscription')
  @RequirePermission(TenantPermissions.SETTINGS_COMPANY_VIEW)
  subscription(@CurrentAuth() auth: AuthContext) {
    return this.billing.companySubscription(auth);
  }

  @Get('consolidations')
  @RequirePermission(TenantPermissions.SHIPMENTS_VIEW)
  listConsolidations(@CurrentAuth() auth: AuthContext) {
    return this.consolidations.list(auth);
  }

  @Post('consolidations')
  @RequirePermission(TenantPermissions.SHIPMENTS_CREATE)
  createConsolidation(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateConsolidationDto,
  ) {
    return this.consolidations.create(auth, dto);
  }
}

@Controller('platform')
@UseGuards(PlatformAuthGuard, PermissionGuard)
export class Phase2PlatformController {
  constructor(
    private readonly domains: DomainsService,
    private readonly usage: UsageService,
    private readonly billing: BillingService,
    private readonly impersonation: ImpersonationService,
  ) {}

  @Get('plans')
  @RequirePermission(PlatformPermissions.TENANTS_VIEW)
  listPlans() {
    return this.billing.listPlans();
  }

  @Patch('plans/:id')
  @RequirePermission(PlatformPermissions.SETTINGS_MANAGE)
  patchPlan(@Param('id') id: string, @Body() dto: PatchPlanDto) {
    return this.billing.patchPlan(id, dto);
  }

  @Get('usage')
  @RequirePermission(PlatformPermissions.USAGE_VIEW)
  platformUsage(@Query('tenantId') tenantId?: string) {
    return this.usage.platformUsage(tenantId);
  }

  @Get('tenants/:id/usage')
  @RequirePermission(PlatformPermissions.USAGE_VIEW)
  tenantUsage(@Param('id') id: string) {
    return this.usage.listForTenant(id);
  }

  @Post('tenants/:id/domains')
  @RequirePermission(PlatformPermissions.TENANTS_UPDATE)
  setDomain(@Param('id') id: string, @Body() dto: UpsertCustomDomainDto) {
    return this.domains.upsertForPlatform(id, dto.hostname);
  }

  @Post('tenants/:id/domains/:domainId/verify')
  @RequirePermission(PlatformPermissions.TENANTS_UPDATE)
  verifyDomain(@Param('id') id: string, @Param('domainId') domainId: string) {
    return this.domains.verifyPlatform(id, domainId);
  }

  @Post('tenants/:id/impersonate')
  @RequirePermission(PlatformPermissions.TENANTS_UPDATE)
  impersonate(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ImpersonateDto,
  ) {
    return this.impersonation.start(auth, id, dto.reason);
  }
}
