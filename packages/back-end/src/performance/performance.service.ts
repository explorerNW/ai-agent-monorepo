import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { ClickHouseService } from './clickhouse/clickhouse.service';
import { map, firstValueFrom } from 'rxjs';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(
    @Inject('PERFORMANCE_SERVICE') private client: ClientRMQ,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect().then(() => {
        this.logger.log('✅ RabbitMQ client connected');
      });
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
    }
  }

  recordPerformance(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ - use emit for fire-and-forget (no response needed)
      this.client.emit('performance.metrics', data).pipe(
        map(() => {
          this.logger.log('✅ API metric sent to RabbitMQ');
        }),
      );

      // 同时保存到 ClickHouse (用于备份和分析)
      // await this.clickHouseService.insertPerformanceData(data);
      return Promise.resolve({ success: true });
    } catch (error) {
      this.logger.error('Error recording performance metric:', error);
      // Don't throw - allow the request to succeed even if storage fails
      return Promise.resolve({
        success: false,
        error: 'Failed to store metric',
      });
    }
  }

  recordAPIMetric(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ - use emit for fire-and-forget (no response needed)
      this.client.emit('api.metrics', data).pipe(
        map(() => {
          this.logger.log('✅ API metric sent to RabbitMQ');
        }),
      );

      return Promise.resolve({ success: true });

      // 同时保存到 ClickHouse (用于备份和分析)
      // await this.clickHouseService.insertAPIData(data);
    } catch (error) {
      this.logger.error('Error recording API metric:', error);
      // Don't throw - allow the request to succeed even if storage fails
      return Promise.resolve({
        success: false,
        error: 'Failed to store API metric',
      });
    }
  }

  async recordErrorMetric(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ - use emit for fire-and-forget (no response needed)
      this.client.emit('error.metrics', data);

      return new Promise((resole) => {
        resole({ success: true });
      });
    } catch (error) {
      this.logger.error('Error recording error metric:', error);
      // Don't throw - allow the request to succeed even if storage fails
      return { success: false, error: 'Failed to store error metric' };
    }
  }

  async recordCustomMetric(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ - use emit for fire-and-forget (no response needed)
      this.client.emit('custom.metrics', data);

      return new Promise((resole) => {
        resole({ success: true });
      });
    } catch (error) {
      this.logger.error('Error recording custom metric:', error);
      // Don't throw - allow the request to succeed even if storage fails
      return { success: false, error: 'Failed to store custom metric' };
    }
  }

  async getPerformanceSummary(fromDate: string, toDate: string): Promise<any> {
    return await firstValueFrom(
      this.client.send('get.performance.summary', { fromDate, toDate }),
    );
  }
}
