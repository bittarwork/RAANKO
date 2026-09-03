import { Global, Module } from '@nestjs/common';

/** Tenant catalog helpers live with platform provisioning; this module marks the boundary. */
@Global()
@Module({})
export class TenantsModule {}
