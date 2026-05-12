import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpCode,
  Logger,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsArrayDto } from './dto/create-analytics-array.dto';
import { catchError, map } from 'rxjs';

@Controller('api/v1/track')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @HttpCode(200) // 直接返回200，减少握手时间
  async track(@Body() wrapper: CreateAnalyticsArrayDto) {
    const events = wrapper.events;

    if (!events || events.length === 0) {
      this.logger.warn('⚠️ 收到空事件数组');
      return { status: 'fail', error: 'No events to track' };
    }

    this.logger.log(`📨 接收到追踪事件: ${events.length} 条`);

    try {
      // 区分处理不同类型的事件
      const webVitalsEvents = events.filter(
        (e) => e.eventName === 'web_vitals_summary',
      );
      const otherEvents = events.filter(
        (e) => e.eventName !== 'web_vitals_summary',
      );

      // 1. Web Vitals 事件保存到 PostgreSQL
      if (webVitalsEvents.length > 0) {
        this.logger.log(
          `💾 保存 ${webVitalsEvents.length} 条 Web Vitals 数据到 PostgreSQL`,
        );
        for (const event of webVitalsEvents) {
          // 验证 properties 是否包含必需的 metrics 字段
          if (!event.properties || !event.properties.metrics) {
            this.logger.warn('⚠️ Web Vitals 事件缺少 metrics 字段，跳过');
            continue;
          }

          // 将 CreateAnalyticsDto 转换为 WebVitalsEventData 格式
          const webVitalsData = {
            eventName: event.eventName,
            userId: event.userId,
            url: event.url,
            properties: {
              metrics: event.properties.metrics,
              navigationType: event.properties.navigationType,
              timestamp: event.properties.timestamp || event.timestamp,
            },
          };

          await this.analyticsService.saveWebVitals(webVitalsData);
        }
      }

      // 2. 其他事件投递到 RabbitMQ
      if (otherEvents.length > 0) {
        this.logger.log(`📤 发送 ${otherEvents.length} 条常规事件到 RabbitMQ`);
        this.analyticsService.sendToQueue(otherEvents).pipe(
          map(() => {
            this.logger.log('✅ 常规事件已发送到 RabbitMQ');
          }),
          catchError((error) => {
            this.logger.error('❌ 常规事件发送失败:', error);
            throw error;
          }),
        );
      }

      return {
        status: 'success',
        message: {
          webVitalsSaved: webVitalsEvents.length,
          eventsSentToMQ: otherEvents.length,
        },
      };
    } catch (error) {
      this.logger.error('❌ 事件处理失败:', error);
      return {
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('web-vitals/stats')
  async getWebVitalsStats(
    @Query('days', new DefaultValuePipe(7), new ParseIntPipe()) days: number,
    @Query('url') url?: string,
  ) {
    // Validate days parameter: must be positive number, default to 7
    const validDays = days && days > 0 ? days : 7;

    return this.analyticsService.getWebVitalsStats(url, validDays);
  }
}
