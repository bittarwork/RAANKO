import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [AuthGuardsModule, DocumentsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
