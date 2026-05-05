import { Module } from '@nestjs/common';
import { PDFProcessController } from './pdf-process.controller';
import { PDFProcessService } from './pdf-process.service';
import { ParallelTaskModule } from '../parallel-task/parallel-task.module';
import { TesseractModule } from '../tesseract/tesseract.module';

@Module({
  imports: [ParallelTaskModule, TesseractModule],
  controllers: [PDFProcessController],
  providers: [PDFProcessService],
})
export class PDFProcessModule {}
