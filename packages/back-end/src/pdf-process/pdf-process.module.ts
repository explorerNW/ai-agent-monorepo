import { Module } from '@nestjs/common';
import { PDFProcessController } from './pdf-process.controller';
import { PDFProcessService } from './pdf-process.server';

@Module({
  imports: [],
  controllers: [PDFProcessController],
  providers: [PDFProcessService],
})
export class PDFProcessModule {}
