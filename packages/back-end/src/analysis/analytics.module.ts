import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { WebVitalsEvent } from './entities/web-vitals.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebVitalsEvent]),
    ClientsModule.registerAsync([
      {
        name: 'RMQ_SERVICE',
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
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
