import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { ReviewService } from './review/review.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService, ReviewService],
})
export class AppModule {}
