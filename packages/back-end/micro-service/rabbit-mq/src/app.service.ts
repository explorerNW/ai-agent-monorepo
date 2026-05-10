import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  message(message: Record<string, any>) {
    this.logger.log('message', message);
  }
}
