import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { catchError, map, throwError } from 'rxjs';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(@Inject('RMQ_SERVICE') private rmq: ClientRMQ) {}

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
}
