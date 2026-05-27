import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { ClickHouseService } from './clickhouse/clickhouse.service';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(
    @Inject('PERFORMANCE_SERVICE') private client: ClientRMQ,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('✅ RabbitMQ client connected');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
    }
  }

  async recordPerformance(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ - use emit for fire-and-forget (no response needed)
      this.client.emit('performance.metrics', data);

      // 同时保存到 ClickHouse (用于备份和分析)
      await this.clickHouseService.insertPerformanceData(data);

      return { success: true };
    } catch (error) {
      this.logger.error('Error recording performance metric:', error);
      // Don't throw - allow the request to succeed even if storage fails
      return { success: false, error: 'Failed to store metric' };
    }
  }

  async recordAPIMetric(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ - use emit for fire-and-forget (no response needed)
      this.client.emit('api.metrics', data);

      // 同时保存到 ClickHouse (用于备份和分析)
      await this.clickHouseService.insertAPIData(data);

      return { success: true };
    } catch (error) {
      this.logger.error('Error recording API metric:', error);
      // Don't throw - allow the request to succeed even if storage fails
      return { success: false, error: 'Failed to store API metric' };
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
}
