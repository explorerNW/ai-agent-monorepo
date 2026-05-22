import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai-qwen/ai.module';
import { ReviewService } from './code-review/code-review.service';
import { CodeReviewController } from './code-review/code-review.controller';
import { PDFProcessModule } from './pdf-process/pdf-process.module';
import { AnalyticsModule } from './analysis/analytics.module';
import { RedisModule } from './redis/redis.module';
import { TimeLocationMcpModule } from './mcp/time-location/time-location.module';
import { PerformanceModule } from './performance/performance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'admin'),
        password: configService.get('DB_PASSWORD', 'admin123'),
        database: configService.get('DB_NAME', 'analytics'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production', // 生产环境禁用自动同步
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AiModule,
    PDFProcessModule,
    AnalyticsModule,
    TimeLocationMcpModule,
    PerformanceModule,
  ],
  controllers: [AppController, CodeReviewController],
  providers: [AppService, ReviewService],
})
export class AppModule {}
