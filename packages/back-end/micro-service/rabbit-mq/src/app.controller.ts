import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsDto } from './analytics.dto';
import { catchError, map, throwError } from 'rxjs';
import { ClickHouseService } from './clickhouse/clickhouse.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  @MessagePattern('rmq-message')
  message(@Payload() payload: AnalyticsDto[]) {
    this.logger.log('📨 收到消息:', payload);
    return this.appService.message(payload).pipe(
      map(() => {
        this.logger.log('✅ 消息处理完成');
        return { message_send: true };
      }),
      catchError((error) => {
        this.logger.error('❌ 消息处理失败:', error);
        // 选择重新抛出错误或返回特定的错误对象
        return throwError(() => ({ message_send: false, error }));
      }),
    );
  }

  @MessagePattern('performance.metrics')
  async handlePerformanceMetrics(@Payload() data: any) {
    this.logger.log('Received performance metrics:');

    // 存储到 ClickHouse
    await this.clickHouseService.insertPerformanceData(data);

    return { success: true, message: 'Performance data stored successfully' };
  }

  @MessagePattern('api.metrics')
  async handleAPIMetrics(@Payload() data: any) {
    this.logger.log('Received API metrics:');
    // 存储到 ClickHouse
    await this.clickHouseService.insertAPIData(data);

    return { success: true, message: 'API data stored successfully' };
  }

  @MessagePattern('get.performance.summary')
  async getPerformanceSummary(
    @Payload() data: { fromDate: string; toDate: string },
  ) {
    try {
      this.logger.log('Received performance summary request:', data);
      return await this.clickHouseService.getPerformanceSummary(
        new Date(data.fromDate),
        new Date(data.toDate),
      );
    } catch (error) {
      this.logger.error('Error processing performance summary request:', error);
      throw error;
    }
  }
}
