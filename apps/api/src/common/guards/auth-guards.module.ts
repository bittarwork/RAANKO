import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  CompanyAuthGuard,
  PlatformAuthGuard,
  PortalAuthGuard,
  AnySurfaceAuthGuard,
} from './auth.guards';
import { PermissionGuard } from './permission.guard';
import { TenantWriteModeGuard } from './tenant-write-mode.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_ACCESS_SECRET') ??
          'dev-only-change-me-access-secret-min-32',
      }),
    }),
  ],
  providers: [
    PlatformAuthGuard,
    CompanyAuthGuard,
    PortalAuthGuard,
    AnySurfaceAuthGuard,
    PermissionGuard,
    TenantWriteModeGuard,
  ],
  exports: [
    JwtModule,
    PlatformAuthGuard,
    CompanyAuthGuard,
    PortalAuthGuard,
    AnySurfaceAuthGuard,
    PermissionGuard,
    TenantWriteModeGuard,
  ],
})
export class AuthGuardsModule {}
