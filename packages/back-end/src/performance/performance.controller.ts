import { Controller, Post, Body, Get, Logger, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';

interface IPerformanceData {
  anonymousId: string;
  eventData?: {
    url?: string;
    fcp?: number;
    lcp?: number;
    cls?: number;
    fid?: number;
    ttfb?: number;
    inp?: number;
    error?: Error; // 错误对象
    message?: string; // 错误信息
    reason?: string; // 错误原因
    stack?: string; // 错误堆栈
    filename?: string; // 错误文件名
    duration?: string; // 接口耗时
    success?: boolean; // 接口是否成功
    type?: 'page_view' | 'unhandledrejection';
    path?: string; // 接口路径
  }; // 具体的事件数据
  eventType: string;
  userAgent: string;
  timestamp: number | string;
}

@Controller('api/performance')
export class PerformanceController {
  private readonly logger: Logger = new Logger(PerformanceController.name);
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  async recordPerformance(
    @Body()
    performanceData: IPerformanceData[],
  ) {
    try {
      const performanceList = performanceData.filter(
        (data) => data.eventType === 'performance',
      );
      const apiList = performanceData.filter(
        (data) => data.eventType === 'api',
      );
      const errorList = performanceData.filter(
        (data) => data.eventType === 'error',
      );
      const customList = performanceData.filter(
        (data) => data.eventType === 'custom',
      );

      // 性能指标
      await Promise.all(
        performanceList.map((data) => {
          return this.performanceService.recordPerformance(data);
        }),
      );

      // API 指标
      await Promise.all(
        apiList.map((data) => {
          return this.performanceService.recordAPIMetric(data);
        }),
      );

      // 错误指标
      await Promise.all(
        errorList.map((data) => {
          return this.performanceService.recordErrorMetric(data);
        }),
      );

      // 自定义指标
      await Promise.all(
        customList.map((data) => {
          return this.performanceService.recordCustomMetric(data);
        }),
      );
      return { success: true };
    } catch (error) {
      console.error(
        '[PerformanceController] Error recording performance:',
        error,
      );
      throw error;
    }
  }

  @Get('summary')
  async getSummary(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return await this.performanceService.getPerformanceSummary(
      fromDate,
      toDate,
    );
  }
}
