import { Module } from '@nestjs/common';
import {
  DocumentAccessController,
  DocumentsController,
} from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthGuardsModule } from '../common/guards/auth-guards.module';

@Module({
  imports: [AuthGuardsModule],
  controllers: [DocumentsController, DocumentAccessController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
