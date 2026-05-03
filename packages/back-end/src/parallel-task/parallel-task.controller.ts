import { Controller, Get, Logger } from '@nestjs/common';
import { ParallelTaskService } from '../parallel-task/parallel-task.service';

@Controller('parallel')
export class ParallelTaskController {
  private readonly logger = new Logger(ParallelTaskController.name);

  constructor(private readonly parallelTaskService: ParallelTaskService) {}

  /**
   * 获取服务器CPU信息
   * GET /parallel/cpu-info
   */
  @Get('cpu-info')
  getCpuInfo() {
    const cores = this.parallelTaskService.getCPUCores();
    const optimalConcurrency =
      this.parallelTaskService.calculateOptimalConcurrency();

    return {
      cpuCores: cores,
      optimalConcurrency,
      recommendedUsage: `${Math.floor(cores * 0.75)} 个并发任务 (75% CPU利用率)`,
    };
  }
}
