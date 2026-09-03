import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { QuotesModule } from '../quotes/quotes.module';
import { DocumentsModule } from '../documents/documents.module';
import { FinanceModule } from '../finance/finance.module';
import { SupportModule } from '../support/support.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [
    AuthGuardsModule,
    QuotesModule,
    DocumentsModule,
    FinanceModule,
    SupportModule,
    OperationsModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
