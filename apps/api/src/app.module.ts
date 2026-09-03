import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/crypto/crypto.module';
import { AuthModule } from './auth/auth.module';
import { PlatformModule } from './platform/platform.module';
import { OrganizationModule } from './organization/organization.module';
import { TenantsModule } from './tenants/tenants.module';
import { MailModule } from './mail/mail.module';
import { CrmModule } from './crm/crm.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { QuotesModule } from './quotes/quotes.module';
import { OperationsModule } from './operations/operations.module';
import { StorageModule } from './storage/storage.module';
import { DocumentsModule } from './documents/documents.module';
import { FinanceModule } from './finance/finance.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { PortalModule } from './portal/portal.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { Phase2Module } from './phase2/phase2.module';
import { FutureModule } from './future/future.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),
    StorageModule,
    PrismaModule,
    CryptoModule,
    RateLimitModule,
    MailModule,
    TenantsModule,
    OrganizationModule,
    AuthModule,
    PlatformModule,
    CrmModule,
    SuppliersModule,
    QuotesModule,
    OperationsModule,
    DocumentsModule,
    FinanceModule,
    ReportsModule,
    NotificationsModule,
    SupportModule,
    PortalModule,
    Phase2Module,
    FutureModule,
    HealthModule,
  ],
})
export class AppModule {}
