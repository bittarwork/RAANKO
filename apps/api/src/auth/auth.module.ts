import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [AuthGuardsModule, OrganizationModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, AuthGuardsModule],
})
export class AuthModule {}
