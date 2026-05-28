import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { ClickHouseService } from './clickhouse/clickhouse.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
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
  providers: [PerformanceService, ClickHouseService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
