import { Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { REDIS_CLIENT } from './redis.module';
import type { RedisClientType } from 'redis';

@Injectable()
export class SeckillService {
  // 预加载 Lua 脚本，避免每次请求都读取磁盘 IO
  private readonly seckillScript: string;

  constructor(
    @Inject({ forwardRef: () => REDIS_CLIENT })
    private readonly redisClient: RedisClientType,
  ) {
    // 在构造函数中读取 Lua 脚本内容
    const scriptPath = path.join(__dirname, 'scripts/seckill.lua');
    this.seckillScript = fs.readFileSync(scriptPath, 'utf-8');
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
    } catch (error) {
      console.error('Lua 脚本执行失败:', error);
      throw new Error('系统繁忙，请稍后再试');
    }
  }
}
