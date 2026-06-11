import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { RedisService } from './redis.service';
import { UseRedisCache, InvalidateCache } from './redis.decorators';
import { RedisCacheInterceptor } from './redis.interceptor';
import { Idempotent } from '../idempotent/idempotent.decorator';
import { IdempotentInterceptor } from '../idempotent/idempotent.interceptor';
import { REDIS_CLIENT } from './redis.module';
import type { RedisClientType } from 'redis';
import { SeckillService } from './seckill.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Redis功能演示控制器
 * 展示所有核心功能的使用方法
 */
@Controller('redis-demo')
@UseInterceptors(RedisCacheInterceptor)
export class RedisDemoController {
  constructor(
    private readonly redisService: RedisService,
    @Inject({ forwardRef: () => REDIS_CLIENT })
    private readonly redisClient: RedisClientType,
    private readonly seckillService: SeckillService,
  ) {}

  /**
   * 示例1: 基础缓存操作
   */
  @Get('basic-cache')
  async basicCacheExample() {
    const key = 'demo:basic';

    // 设置缓存（带防雪崩抖动）
    await this.redisService.set(
      key,
      { message: 'Hello Redis', timestamp: Date.now() },
      {
        ttl: 300,
        jitter: true,
      },
    );

    // 获取缓存
    const cached = await this.redisService.get(key);

    return {
      operation: 'Basic Cache',
      cached,
    };
  }

  /**
   * 示例2: getOrSet - 自动处理缓存穿透和击穿
   */
  @Get('get-or-set/:id')
  async getOrSetExample(@Param('id') id: string) {
    const key = `demo:item:${id}`;

    const data = await this.redisService.getOrSet(
      key,
      async () => {
        // 模拟数据库查询（只在缓存miss时执行）
        console.log(`Fetching item ${id} from database...`);
        await new Promise((resolve) => setTimeout(resolve, 100)); // 模拟慢查询

        if (id === 'not-found') {
          return null; // 返回null会被缓存为空值
        }

        return {
          id,
          name: `Item ${id}`,
          createdAt: new Date().toISOString(),
        };
      },
      {
        ttl: 600,
        jitter: true,
        cacheNull: true, // 防止缓存穿透
        nullTtl: 60,
      },
    );

    return {
      operation: 'GetOrSet with Anti-Penetration/Breakdown',
      data,
    };
  }

  /**
   * 示例3: 分布式锁 - 防止并发问题
   */
  @Post('lock/inventory/:productId')
  @Idempotent(10) // 幂等性保护，10秒内重复提交视为无效
  @UseInterceptors(IdempotentInterceptor)
  async distributedLockExample(@Param('productId') productId: string) {
    const lockKey = `lock:inventory:${productId}`;

    return await this.redisService.useLock(
      lockKey,
      async () => {
        // 模拟库存扣减
        const stockKey = `stock:${productId}`;
        let stock = (await this.redisService.get<number>(stockKey)) || 100;

        if (stock <= 0) {
          throw new Error('库存不足');
        }

        stock--;
        await this.redisService.set(stockKey, stock, {
          ttl: 36000,
          jitter: true,
          jitterRatio: 0.1,
        });

        return {
          operation: 'Distributed Lock - Inventory Deduction',
          productId,
          remainingStock: stock,
          message: '库存扣减成功',
        };
      },
      { ttl: 3000 }, // 锁超时3秒
    );
  }

  /**
   * 示例4: 使用装饰器自动缓存GET请求
   */
  @Get('auto-cache/users/:id')
  @UseRedisCache({ ttl: 300, keyPrefix: 'demo:user:' })
  async autoCacheExample(@Param('id') id: string) {
    // 模拟数据库查询
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * 示例5: 更新数据后清除缓存
   */
  @Put('invalidate/user/:id')
  @InvalidateCache('demo:user:*')
  async invalidateCacheExample(@Param('id') id: string, @Body() data: any) {
    // 模拟更新操作
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      operation: 'Cache Invalidation',
      userId: id,
      updatedData: data,
      message: '用户信息已更新，相关缓存已清除',
    };
  }

  /**
   * 示例6: 批量删除缓存
   */
  @Delete('batch-delete')
  async batchDeleteExample() {
    const keys = ['demo:basic', 'demo:item:1', 'demo:item:2', 'stock:product1'];

    await this.redisService.delMany(keys);

    return {
      operation: 'Batch Delete',
      deletedKeys: keys,
      message: '批量删除完成',
    };
  }

  /**
   * 示例7: 布隆过滤器 - 快速判断元素是否存在
   */
  @Get('bloom-filter/check/:value')
  async bloomFilterCheck(@Param('value') value: string) {
    const exists = await this.redisService.bloomExists('demo:set', value);

    return {
      operation: 'Bloom Filter Check',
      value,
      mightExist: exists,
      note: exists ? '可能存在（需要进一步验证）' : '一定不存在',
    };
  }

  @Post('bloom-filter/add/:value')
  async bloomFilterAdd(@Param('value') value: string) {
    await this.redisService.bloomAdd('demo:set', value);

    return {
      operation: 'Bloom Filter Add',
      value,
      message: '值已添加到布隆过滤器',
    };
  }

  /**
   * 示例8: 手动管理锁（高级用法）
   */
  @Post('manual-lock/resource/:resourceId')
  async manualLockExample(@Param('resourceId') resourceId: string) {
    const lockKey = `lock:resource:${resourceId}`;

    // 尝试获取锁
    const lockId = await this.redisService.tryLock(lockKey, { ttl: 5000 });

    if (!lockId) {
      return {
        operation: 'Manual Lock',
        success: false,
        message: '资源正在被其他进程使用',
      };
    }

    try {
      // 执行业务逻辑
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        operation: 'Manual Lock',
        success: true,
        lockId,
        message: '锁获取成功，业务逻辑执行完成',
      };
    } finally {
      // 确保释放锁
      await this.redisService.releaseLock(lockKey, lockId);
    }
  }

  /**
   * 示例9: 阻塞等待锁
   */
  @Post('blocking-lock/queue/:taskId')
  async blockingLockExample(@Param('taskId') taskId: string) {
    const lockKey = `lock:task:${taskId}`;

    // 阻塞等待获取锁（最多等待1秒）
    const lockId = await this.redisService.lock(lockKey, {
      ttl: 10000,
      retryDelay: 100,
      retryCount: 10,
    });

    if (!lockId) {
      return {
        operation: 'Blocking Lock',
        success: false,
        message: '等待锁超时',
      };
    }

    try {
      // 执行任务
      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        operation: 'Blocking Lock',
        success: true,
        message: '任务执行成功',
      };
    } finally {
      await this.redisService.releaseLock(lockKey, lockId);
    }
  }

  /**
   * 示例10: 查看缓存统计信息
   */
  @Get('stats')
  async cacheStats() {
    // 注意：cache-manager的stats方法取决于具体实现
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          operation: 'Cache Statistics',
          note: '实际项目中可以集成监控指标收集',
          recommendations: [
            '监控缓存命中率',
            '监控Redis内存使用',
            '监控锁竞争情况',
            '设置告警阈值',
          ],
        });
      }, 100);
    });
    return promise;
  }

  @Post('grab/:voucherId')
  @UseInterceptors(IdempotentInterceptor)
  async grabOrder(@Param('voucherId') voucherId: string) {
    const userId = uuidv4(); // 假设通过守卫解析出用户ID
    const orderId = uuidv4(); // 生成全局唯一订单号

    const result = await this.seckillService.executeSeckill(
      voucherId,
      userId,
      orderId,
    );

    switch (result) {
      case 1:
        return { code: 400, msg: '库存不足' };
      case 2:
        return { code: 400, msg: '不能重复下单' };
      case 0:
        // 秒杀成功，立即返回订单号，后续订单入库由 MQ 消费者异步处理
        return { code: 200, msg: '抢单成功', orderId };
      case -2:
        return { code: 400, msg: '库存值格式错误' };
      case -3:
        return { code: 400, msg: '库存扣减异常' };
      case -4:
        return { code: 500, msg: '消息队列发送失败' };
      default:
        return { code: 500, msg: '系统异常' };
    }
  }
}
