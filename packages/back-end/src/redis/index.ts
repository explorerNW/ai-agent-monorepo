export { RedisModule } from './redis.module';
export { RedisService } from './redis.service';
export { RedisCacheInterceptor } from './redis.interceptor';
export { RedisDemoController } from './redis-demo.controller';
export {
  UseRedisCache,
  InvalidateCache,
  UseRedisLock,
} from './redis.decorators';
export type {
  RedisConfig,
  LockOptions,
  CacheOptions,
  CacheInterceptorOptions,
  BloomFilterOptions,
} from './redis.interfaces';
export {
  REDIS_DEFAULT_CONFIG,
  LOCK_DEFAULT_OPTIONS,
  CACHE_DEFAULT_OPTIONS,
  CACHE_KEY_PREFIXES,
  SPECIAL_CACHE_KEYS,
} from './redis.constants';
