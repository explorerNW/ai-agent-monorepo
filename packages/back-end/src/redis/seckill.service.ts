import {
  Injectable,
  Inject,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { REDIS_CLIENT } from './redis.module';
import type { RedisClientType } from 'redis';

@Injectable()
export class SeckillService implements OnModuleInit {
  private readonly logger = new Logger(SeckillService.name);
  // 预加载 Lua 脚本，避免每次请求都读取磁盘 IO
  private seckillScript: string;

  constructor(
    @Inject({ forwardRef: () => REDIS_CLIENT })
    private readonly redisClient: RedisClientType,
  ) {}

  onModuleInit() {
    const scriptPath = path.join(__dirname, 'scripts/seckill.lua');
    try {
      this.seckillScript = fs.readFileSync(scriptPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to load seckill Lua script: ${error.message}`);
    }
  }

  async executeSeckill(
    voucherId: string,
    userId: string,
    orderId: string,
  ): Promise<number> {
    try {
      // 使用 ioredis 执行 Lua 脚本
      // ⚠️ 注意：ioredis v4+ 必须使用这种对象传参格式
      const result = await this.redisClient.eval(this.seckillScript, {
        keys: [], // KEYS 数组，本例中未使用
        arguments: [voucherId, userId, orderId], // ARGV 数组
      });

      // result 为 Lua 脚本返回的 0, 1, 2
      return Number(result);
    } catch (error: any) {
      // 记录详细错误信息供调试
      this.logger.error('Seckill execution failed', error.stack);

      // 向上传播一个标准化的业务异常，或者重新抛出带上下文的错误
      throw new InternalServerErrorException(
        'Seckill service unavailable',
        error,
      );
    }
  }
}
