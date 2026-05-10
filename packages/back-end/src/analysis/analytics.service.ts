import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(@Inject('RMQ_SERVICE') private rmq: ClientRMQ) {}

  sendToQueue(events: any[]) {
    try {
      // 使用 send 方法发送消息并等待响应
      return this.rmq.send('rmq-message', events);
    } catch (error) {
      this.logger.error('❌ 消息发送失败:', error);
      throw error;
    }
  }
}
