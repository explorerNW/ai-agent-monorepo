import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IDEMPOTENT_KEY } from './idempotent.decorator';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { logger } from '../utils';

@Injectable()
export class IdempotentInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject({ forwardRef: () => REDIS_CLIENT })
    private readonly redisClient: RedisClientType,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const seconds = this.reflector.get<number>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    logger.debug(`IdempotentInterceptor: seconds=${seconds}`);

    // 如果没有加装饰器，直接放行
    if (!seconds) return next.handle();

    const request = context.switchToHttp().getRequest();
    // 1. 获取请求头中的唯一标识（通常由前端生成 UUID 传入）
    const requestId = request.headers['x-request-id'];
    if (!requestId) {
      throw new BadRequestException('缺少幂等性标识 X-Request-Id');
    }

    // 2. 构建 Redis Key (建议加上接口路径，防止不同接口串号)
    const key = `idempotent:${request.path}:${requestId}`;

    // 3. 核心：使用原子命令 SET key value NX EX seconds
    // 只有当 key 不存在时才设置成功，并自动在指定秒数后过期

    const result = await this.redisClient.set(key, '1', {
      expiration: {
        type: 'EX',
        value: seconds, // 设置过期时间（秒）
      },
      condition: 'NX', // 仅在键不存在时设置
    });

    // 4. 如果返回 null，说明 key 已存在，即重复提交
    if (!result) {
      throw new BadRequestException('请勿重复提交，请稍后再试');
    }

    // 5. 首次请求，放行执行业务逻辑
    return next.handle();
  }
}
