import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai-qwen/ai.module';
import { ReviewService } from './code-review/code-review.service';
import { CodeReviewController } from './code-review/code-review.controller';
import { PDFProcessModule } from './pdf-process/pdf-process.module';
import { AnalyticsModule } from './analysis/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
    AiModule,
    PDFProcessModule,
    AnalyticsModule,
  ],
  controllers: [AppController, CodeReviewController],
  providers: [AppService, ReviewService],
})
export class AppModule {}
