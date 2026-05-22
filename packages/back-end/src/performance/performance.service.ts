import { Inject, Injectable } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { ClickHouseService } from './clickhouse/clickhouse.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PerformanceService {
  constructor(
    @Inject('PERFORMANCE_SERVICE') private client: ClientRMQ,
    private readonly clickHouseService: ClickHouseService,
  ) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async recordPerformance(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ
      const result = await this.client
        .emit('performance.metrics', data)
        .toPromise();

      // 同时保存到 ClickHouse (用于备份和分析)
      await this.clickHouseService.insertPerformanceData(data);

      return result;
    } catch (error) {
      console.error('Error sending to RabbitMQ:', error);
      throw error;
    }
  }

  async recordAPIMetric(data: any): Promise<any> {
    try {
      // 发送到 RabbitMQ
      const result = await firstValueFrom(
        this.client.emit('api.metrics', data),
      );

      // 同时保存到 ClickHouse (用于备份和分析)
      await this.clickHouseService.insertAPIData(data);

      return result;
    } catch (error) {
      console.error('Error sending API metric to RabbitMQ:', error);
      throw error;
    }
  }
}
