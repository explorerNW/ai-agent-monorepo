import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AnalyticsDto } from './analytics.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('rmq-message')
  async message(
    @Payload() payload: AnalyticsDto[],
    @Ctx() context: RmqContext,
  ) {
    try {
      console.log('📨 收到消息:', payload);
      await this.appService.message(payload);

      console.log('✅ 消息处理完成');

      return { message_send: true };
    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      throw error;
    }
  }
}
