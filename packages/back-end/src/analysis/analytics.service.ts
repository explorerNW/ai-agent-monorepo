import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientRMQ } from '@nestjs/microservices';
import { catchError, map, throwError } from 'rxjs';
import { WebVitalsEvent } from './entities/web-vitals.entity';

interface WebVitalsEventData {
  eventName: string;
  userId?: string;
  url: string;
  properties: {
    metrics: any;
    navigationType?: string;
    timestamp?: number | string;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @Inject('RMQ_SERVICE') private rmq: ClientRMQ,
    @InjectRepository(WebVitalsEvent)
    private webVitalsRepo: Repository<WebVitalsEvent>,
  ) {}

  /**
   * 保存 Web Vitals 性能指标到 PostgreSQL
   */
  async saveWebVitals(eventData: WebVitalsEventData) {
    try {
      const timestamp = eventData.properties.timestamp;
      let validTimestamp: number;

      if (typeof timestamp === 'number') {
        validTimestamp = timestamp;
      } else if (typeof timestamp === 'string') {
        // Handle both numeric strings and ISO 8601 format strings
        const date = new Date(timestamp);
        validTimestamp = date.getTime();

        // Check for Invalid Date (returns NaN)
        if (isNaN(validTimestamp)) {
          validTimestamp = Date.now();
        }
      } else {
        validTimestamp = Date.now();
      }

      const webVitals = this.webVitalsRepo.create({
        eventName: eventData.eventName,
        userId: eventData.userId,
        url: eventData.url,
        metrics: eventData.properties.metrics,
        navigationType: eventData.properties.navigationType,
        timestamp: new Date(validTimestamp),
      });

      await this.webVitalsRepo.save(webVitals);
      this.logger.log('✅ Web Vitals 数据已保存到 PostgreSQL');

      return { success: true };
    } catch (error) {
      this.logger.error('❌ 保存 Web Vitals 失败:', error);
      throw error;
    }
  }

  /**
   * 发送常规事件到 RabbitMQ
   */
  sendToQueue(events: any[]) {
    // 使用 emit 发送消息（无需等待响应，避免 RPC 临时队列冲突）
    return this.rmq.emit('rmq-message', events).pipe(
      map(() => {
        this.logger.log('✅ 消息已发送到 RabbitMQ');
        return { message_send: true };
      }),
      catchError((error) => {
        this.logger.error('❌ 消息发送失败:', error);
        // 选择重新抛出错误或返回特定的错误对象
        return throwError(() => error);
      }),
    );
  }

  /**
   * 查询 Web Vitals 统计数据
   */
  async getWebVitalsStats(page?: string, days: number = 7) {
    const queryBuilder = this.webVitalsRepo.createQueryBuilder('wv');

    if (page) {
      queryBuilder.andWhere('wv.url LIKE :page', { page: `%${page}%` });
    }

    queryBuilder
      .andWhere('wv.timestamp >= :date', {
        date: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      })
      .orderBy('wv.timestamp', 'DESC')
      .take(100);

    return await queryBuilder.getMany();
  }
}
