import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { FutureController } from './future.controller';

@Module({
  imports: [AuthGuardsModule],
  controllers: [FutureController],
})
export class FutureModule {}
