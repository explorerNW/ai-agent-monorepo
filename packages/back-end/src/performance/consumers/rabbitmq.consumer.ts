import { Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClickHouseService } from '../clickhouse/clickhouse.service';

@Injectable()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  constructor(private readonly clickHouseService: ClickHouseService) {}

  @MessagePattern('performance.metrics')
  async handlePerformanceMetrics(@Payload() data: any) {
    this.logger.log('Received performance metrics:', data);

    // 存储到 ClickHouse
    await this.clickHouseService.insertPerformanceData(data);

    return { success: true, message: 'Performance data stored successfully' };
  }

  @MessagePattern('api.metrics')
  async handleAPIMetrics(@Payload() data: any) {
    this.logger.log('Received API metrics:', data);
    // 存储到 ClickHouse
    await this.clickHouseService.insertAPIData(data);

    return { success: true, message: 'API data stored successfully' };
  }
}
