import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsDto } from './analytics.dto';
import { catchError, map, of } from 'rxjs';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @MessagePattern('rmq-message')
  message(@Payload() payload: AnalyticsDto[]) {
    this.logger.log('📨 收到消息:', payload);
    return this.appService.message(payload).pipe(
      map(() => {
        this.logger.log('✅ 消息处理完成');
        return { message_send: true };
      }),
      catchError((error) => {
        this.logger.error('❌ 消息处理失败:', error);
        return of({ message_send: false, error });
      }),
    );
  }
}
