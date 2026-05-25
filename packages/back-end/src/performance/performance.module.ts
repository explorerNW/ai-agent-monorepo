import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { ClickHouseService } from './clickhouse/clickhouse.service';
import { RabbitMQConsumer } from './consumers/rabbitmq.consumer';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PERFORMANCE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const user = configService.get<string>('RABBITMQ_USER') || 'guest';
          const pass = configService.get<string>('RABBITMQ_PASS') || 'guest';
          const host =
            configService.get<string>('RABBITMQ_HOST') || 'localhost';
          const port = configService.get<string>('RABBITMQ_PORT') || '5672';

          if (!user || !pass || !host) {
            throw new Error(
              'Missing required RabbitMQ configuration: RABBITMQ_USER, RABBITMQ_PASS, or RABBITMQ_HOST',
            );
          }

          return {
            transport: Transport.RMQ,
            options: {
              urls: [`amqp://${user}:${pass}@${host}:${port}`],
              queue: 'performance_queue',
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService, ClickHouseService, RabbitMQConsumer],
  exports: [PerformanceService],
})
export class PerformanceModule {}
