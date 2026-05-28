import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClickHouseService } from './clickhouse/clickhouse.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ClickHouseService],
})
export class AppModule {}
