import { Controller, Post, Body } from '@nestjs/common';
import { PerformanceService } from './performance.service';

interface IPerformanceData {
  data: {
    type: string;
    metrics: {
      url: string;
      method: string;
      startTime: number | string;
      duration: number;
      status: number;
      size?: number;
    }[];
    pageUrl: string;
    userAgent: string;
    timestamp: number | string;
  };
}

@Controller('api/performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  async recordPerformance(
    @Body()
    performanceData: IPerformanceData,
  ) {
    try {
      if (performanceData.data.type === 'api') {
        // 单个 API 指标（兼容旧格式）
        return await this.performanceService.recordAPIMetric(performanceData);
      } else if (performanceData.data.type === 'api-batch') {
        // 批量 API 指标
        const metrics = performanceData.data.metrics || [];
        const pageUrl = performanceData.data.pageUrl || '';
        const userAgent = performanceData.data.userAgent || '';
        const batchTimestamp = performanceData.data.timestamp || Date.now();

        for (const metric of metrics) {
          // 确保每个指标都有完整的字段，并正确转换时间戳为ISO 8601格式
          const formattedMetric = {
            url: metric.url,
            method: metric.method,
            startTime: new Date(metric.startTime).toISOString(),
            duration: Number(metric.duration),
            status: Number(metric.status),
            size: metric.size ? Number(metric.size) : undefined,
            pageUrl: pageUrl,
            userAgent: userAgent,
            timestamp: new Date(batchTimestamp).toISOString(), // Convert to ISO string
          };
          await this.performanceService.recordAPIMetric(formattedMetric);
        }
        return { success: true, count: metrics.length };
      } else {
        // 性能指标
        return await this.performanceService.recordPerformance(performanceData);
      }
    } catch (error) {
      console.error(
        '[PerformanceController] Error recording performance:',
        error,
      );
      throw error;
    }
  }
}
