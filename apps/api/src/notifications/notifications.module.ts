import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthGuardsModule, MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
