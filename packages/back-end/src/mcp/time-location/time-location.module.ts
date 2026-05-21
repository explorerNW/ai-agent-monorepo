import { Module } from '@nestjs/common';
import { TimeLocationController } from './time-location.controller';
import { TimeLocationService } from './time-location.service';

@Module({
  controllers: [TimeLocationController],
  providers: [TimeLocationService],
  exports: [TimeLocationService],
})
export class TimeLocationMcpModule {}
