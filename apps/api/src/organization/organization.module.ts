import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { MailModule } from '../mail/mail.module';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';

@Module({
  imports: [MailModule, AuthGuardsModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
