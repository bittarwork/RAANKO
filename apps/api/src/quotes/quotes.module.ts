import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [AuthGuardsModule, DocumentsModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
