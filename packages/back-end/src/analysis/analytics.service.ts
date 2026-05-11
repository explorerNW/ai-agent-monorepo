import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { catchError, map } from 'rxjs';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(@Inject('RMQ_SERVICE') private rmq: ClientRMQ) {}

  sendToQueue(events: any[]) {
    // 使用 send 方法发送消息（需要等待响应）
    return this.rmq.send('rmq-message', events).pipe(
      map(() => {
        this.logger.log('✅ 消息已发送到 RabbitMQ');
        return { message_send: true };
      }),
      catchError((error) => {
        this.logger.error('❌ 消息发送失败:', error);
        throw error;
      }),
    );
  }
}
