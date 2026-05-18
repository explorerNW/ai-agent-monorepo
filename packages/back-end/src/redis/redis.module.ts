import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import { RedisCacheInterceptor } from './redis.interceptor';
import { RedisDemoController } from './redis-demo.controller';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get<number>('REDIS_DB', 0),
        ttl: configService.get<number>('REDIS_TTL', 3600), // 默认1小时
        max: configService.get<number>('REDIS_MAX_ITEMS', 10000), // 最大缓存项数量
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService, RedisCacheInterceptor],
  controllers: [RedisDemoController],
  exports: [RedisService, RedisCacheInterceptor],
})
export class RedisModule {}
