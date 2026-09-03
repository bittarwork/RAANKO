import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { Phase2CompanyController, Phase2PlatformController } from './phase2.controller';
import { DomainsService } from './domains/domains.service';
import { TenantHostService } from './domains/tenant-host.service';
import { EmailSenderService } from './email-sender/email-sender.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { UsageService } from './usage/usage.service';
import { BillingService } from './billing/billing.service';
import { ImpersonationService } from './impersonation/impersonation.service';
import { ConsolidationsService } from './consolidations/consolidations.service';

@Module({
  imports: [AuthGuardsModule],
  controllers: [Phase2CompanyController, Phase2PlatformController],
  providers: [
    DomainsService,
    TenantHostService,
    EmailSenderService,
    WebhooksService,
    UsageService,
    BillingService,
    ImpersonationService,
    ConsolidationsService,
  ],
  exports: [TenantHostService, UsageService],
})
export class Phase2Module {}
