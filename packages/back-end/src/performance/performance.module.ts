import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { ClickHouseService } from './clickhouse/clickhouse.service';
import { RabbitMQConsumer } from './consumers/rabbitmq.consumer';

@Module({
  imports: [
    ClientsModule.register([
      // 添加 RabbitMQ 客户端
      {
        name: 'PERFORMANCE_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://explorernw:admin@me@192.168.1.118:5672'],
          queue: 'performance_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService, ClickHouseService, RabbitMQConsumer],
  exports: [PerformanceService],
})
export class PerformanceModule {}
