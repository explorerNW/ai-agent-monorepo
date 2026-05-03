import { Module } from '@nestjs/common';
import { PDFProcessController } from './pdf-process.controller';
import { PDFProcessService } from './pdf-process.server';
import { ParallelTaskModule } from '../parallel-task/parallel-task.module';

@Module({
  imports: [ParallelTaskModule],
  controllers: [PDFProcessController],
  providers: [PDFProcessService],
})
export class PDFProcessModule {}
