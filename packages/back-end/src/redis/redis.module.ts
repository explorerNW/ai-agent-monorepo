import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import { RedisCacheInterceptor } from './redis.interceptor';
import { RedisDemoController } from './redis-demo.controller';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils';
import { IdempotentInterceptor } from '../idempotent/idempotent.interceptor';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASS'),
        db: configService.get<number>('REDIS_DB', 0),
        ttl: configService.get<number>('REDIS_TTL', 3600), // 默认1小时
        max: configService.get<number>('REDIS_MAX_ITEMS', 10000), // 最大缓存项数量
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const client: RedisClientType = createClient({
          url: `redis://:${configService.get('REDIS_PASS', '')}@${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`,
        });

        // 监听连接错误
        client.on('error', (err) => logger.error('Redis Client Error:', err));

        // 必须手动连接
        await client.connect();

        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
    RedisCacheInterceptor,
    IdempotentInterceptor,
  ],
  controllers: [RedisDemoController],
  exports: [RedisService, RedisCacheInterceptor, REDIS_CLIENT],
})
export class RedisModule {}
