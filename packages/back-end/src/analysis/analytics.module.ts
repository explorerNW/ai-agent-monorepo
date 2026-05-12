import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { WebVitalsEvent } from './entities/web-vitals.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebVitalsEvent]),
    ClientsModule.register([
      // 添加 RabbitMQ 客户端
      {
        name: 'RMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://explorernw:admin@me@192.168.1.118:5672'],
          queue: 'chat.general',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
