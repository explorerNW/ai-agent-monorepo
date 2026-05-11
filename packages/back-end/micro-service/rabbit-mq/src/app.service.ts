import { Injectable, Logger } from '@nestjs/common';
import { map, of } from 'rxjs';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  message(message: Record<string, any>) {
    return of().pipe(
      map(() => {
        this.logger.log('Processing message:', message);
        return true;
      }),
    );
  }
}
