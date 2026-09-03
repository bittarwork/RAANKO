import { Module } from '@nestjs/common';
import {
  OperationsController,
  PublicTrackingController,
} from './operations.controller';
import { OperationsService } from './operations.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';

@Module({
  imports: [AuthGuardsModule],
  controllers: [OperationsController, PublicTrackingController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
