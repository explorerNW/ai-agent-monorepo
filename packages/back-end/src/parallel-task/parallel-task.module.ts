import { Module } from '@nestjs/common';
import { ParallelTaskService } from './parallel-task.service';
import { ParallelTaskController } from './parallel-task.controller';

@Module({
  controllers: [ParallelTaskController],
  providers: [ParallelTaskService],
  exports: [ParallelTaskService],
})
export class ParallelTaskModule {}
