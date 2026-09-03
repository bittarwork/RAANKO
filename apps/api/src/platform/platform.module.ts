import { Module } from '@nestjs/common';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [AuthGuardsModule, MailModule],
  controllers: [PlatformTenantsController],
  providers: [PlatformTenantsService],
  exports: [PlatformTenantsService],
})
export class PlatformModule {}
