import { Module } from '@nestjs/common';
import {
  CompanySupportController,
  CompanySupportCreateController,
  PlatformSupportController,
} from './support.controller';
import { SupportService } from './support.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthGuardsModule, NotificationsModule],
  controllers: [
    CompanySupportController,
    CompanySupportCreateController,
    PlatformSupportController,
  ],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
