import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisService } from './redis.service';
import { REDIS_CACHE_METADATA } from './redis.decorators';
import { CacheInterceptorOptions } from './redis.interfaces';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // 只处理GET请求
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 获取装饰器元数据
    const metadata = this.reflector.get<CacheInterceptorOptions>(
      REDIS_CACHE_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    // 生成缓存键
    const cacheKey = this.generateCacheKey(request, metadata);

    // 尝试从缓存获取
    const cachedValue = await this.redisService.get(cacheKey);
    if (cachedValue !== null && cachedValue !== undefined) {
      // 如果命中缓存，直接返回
      return of(cachedValue);
    }

    // 执行实际的处理函数
    return next.handle().pipe(
      mergeMap(async (response) => {
        // 将响应结果存入缓存
        if (response) {
          await this.redisService.set(cacheKey, response, {
            ttl: metadata.ttl,
            jitter: true,
          });
        }
        return response;
      }),
    );
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    request: any,
    metadata: CacheInterceptorOptions,
  ): string {
    // 如果有自定义键生成器，使用它
    if (metadata.customKeyGenerator) {
      return `${metadata.keyPrefix || ''}${metadata.customKeyGenerator(request)}`;
    }

    // 默认键生成逻辑：HTTP方法 + URL路径 + 查询参数（排除忽略的参数）
    const method = request.method;
    const url = request.url;

    // 解析URL和查询参数
    const urlParts = url.split('?');
    const path = urlParts[0];
    const queryString: string = urlParts[1] || '';

    // 处理查询参数
    let filteredQuery = '';
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const ignoreParams = metadata.ignoreQueryParams || [];

      const filteredParams = new URLSearchParams();
      for (const [key, value] of params.entries()) {
        if (!ignoreParams.includes(key)) {
          filteredParams.append(key, value);
        }
      }

      filteredQuery = filteredParams.toString();
    }

    const key = `${metadata.keyPrefix || ''}${method}:${path}${filteredQuery ? '?' + filteredQuery : ''}`;
    return key;
  }
}
