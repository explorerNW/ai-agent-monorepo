import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * 缓存拦截器装饰器元数据键
 */
export const REDIS_CACHE_METADATA = 'REDIS_CACHE_METADATA';

/**
 * Redis缓存装饰器
 * 用于自动缓存GET请求的响应
 *
 * @example
 * @UseRedisCache({ ttl: 300, keyPrefix: 'users:' })
 * @Get(':id')
 * getUser(@Param('id') id: string) { ... }
 */
export function UseRedisCache(options?: {
  ttl?: number;
  keyPrefix?: string;
  ignoreQueryParams?: string[];
}) {
  return applyDecorators(SetMetadata(REDIS_CACHE_METADATA, options || {}));
}

/**
 * 缓存失效装饰器
 * 用于在POST/PUT/DELETE操作后清除相关缓存
 *
 * @example
 * @InvalidateCache('users:*')
 * @Post()
 * createUser(@Body() data: CreateUserDto) { ... }
 */
export function InvalidateCache(pattern: string | string[]) {
  return SetMetadata('INVALIDATE_CACHE_PATTERN', pattern);
}

/**
 * 分布式锁装饰器
 * 用于在方法执行前获取分布式锁
 *
 * @example
 * @UseRedisLock({ ttl: 10000, keyGenerator: (args) => `order:${args[0]}` })
 * async processOrder(orderId: string) { ... }
 */
export function UseRedisLock(options: {
  ttl?: number;
  keyGenerator?: (args: any[]) => string;
}) {
  return SetMetadata('REDIS_LOCK_METADATA', options);
}
