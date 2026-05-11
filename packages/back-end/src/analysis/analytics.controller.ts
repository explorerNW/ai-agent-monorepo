import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { catchError, map, of } from 'rxjs';

import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsArrayDto } from './dto/create-analytics-array.dto';

@Controller('api/v1/track')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @HttpCode(200) // 直接返回200，减少握手时间
  track(@Body() events: CreateAnalyticsArrayDto[]) {
    if (!events || events.length === 0) {
      this.logger.warn('⚠️ 收到空事件数组');
      return { status: 'fail', error: 'No events to track' };
    }

    this.logger.log('📨 接收到追踪事件:', events.length, '条');

    // 2. 投递到 RabbitMQ (等待确认)
    return this.analyticsService.sendToQueue(events).pipe(
      map((message: { message_send: boolean }) => {
        this.logger.log('✅ 消息已发送到 RabbitMQ');
        return { status: 'success', message };
      }),
      catchError((error) => {
        this.logger.error('❌ 事件投递失败:', error);
        // 即使 MQ 失败，也返回成功，避免影响用户体验
        return of({ status: 'fail', error });
      }),
    );
  }
}
