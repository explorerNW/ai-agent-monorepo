# Redis Module - 完整使用指南

## 📋 目录

- [功能概述](#功能概述)
- [安装配置](#安装配置)
- [核心功能](#核心功能)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

---

## 功能概述

本Redis模块提供了企业级的Redis集成功能，包括：

### ✨ 核心特性

1. **分布式竞争锁** - 基于SET NX EX的原子锁实现
2. **缓存管理** - Cache-Aside和Write-Through模式
3. **缓存雪崩防护** - TTL随机抖动机制（±20%）
4. **缓存穿透防护** - 空值缓存策略
5. **缓存击穿防护** - 互斥锁重建缓存
6. **内存拦截器** - 自动缓存GET请求响应

---

## 安装配置

### 1. 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 可选
REDIS_DB=0
REDIS_TTL=3600  # 默认TTL（秒）
REDIS_MAX_ITEMS=10000  # 最大缓存项数量
```

### 2. 模块导入

```typescript
// app.module.ts
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    RedisModule, // 全局模块，无需导出
    // ... 其他模块
  ],
})
export class AppModule {}
```

---

## 核心功能

### 1. 分布式竞争锁 (Distributed Lock)

#### 基本用法

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class OrderService {
  constructor(private readonly redisService: RedisService) {}

  async processOrder(orderId: string) {
    const lockKey = `lock:order:${orderId}`;

    // 方式1: tryLock - 尝试获取锁，失败立即返回
    const lockId = await this.redisService.tryLock(lockKey, { ttl: 5000 });
    if (!lockId) {
      throw new Error('订单正在处理中，请稍后重试');
    }

    try {
      // 业务逻辑
      await this.doProcessOrder(orderId);
    } finally {
      // 确保释放锁
      await this.redisService.releaseLock(lockKey, lockId);
    }
  }

  // 方式2: lock - 阻塞等待获取锁
  async processOrderWithRetry(orderId: string) {
    const lockKey = `lock:order:${orderId}`;

    const lockId = await this.redisService.lock(lockKey, {
      ttl: 5000, // 锁超时5秒
      retryDelay: 100, // 每100ms重试一次
      retryCount: 10, // 最多重试10次
    });

    if (!lockId) {
      throw new Error('获取锁超时');
    }

    try {
      await this.doProcessOrder(orderId);
    } finally {
      await this.redisService.releaseLock(lockKey, lockId);
    }
  }

  // 方式3: useLock - 自动管理锁的生命周期（推荐）
  async processOrderAuto(orderId: string) {
    const lockKey = `lock:order:${orderId}`;

    return await this.redisService.useLock(
      lockKey,
      async () => {
        // 自动在try-finally中执行，确保锁释放
        return await this.doProcessOrder(orderId);
      },
      { ttl: 5000 },
    );
  }
}
```

---

### 2. 缓存更新策略

#### Cache-Aside Pattern（旁路缓存）

```typescript
@Injectable()
export class UserService {
  constructor(private readonly redisService: RedisService) {}

  async getUser(userId: string) {
    const cacheKey = `user:${userId}`;

    // 先查缓存
    let user = await this.redisService.get(cacheKey);

    if (!user) {
      // 缓存未命中，从数据库查询
      user = await this.userRepository.findOne({ where: { id: userId } });

      // 写入缓存（带防雪崩抖动）
      if (user) {
        await this.redisService.set(cacheKey, user, {
          ttl: 3600, // 1小时
          jitter: true, // 启用随机抖动
          jitterRatio: 0.2, // ±20% 抖动
        });
      } else {
        // 防止缓存穿透：缓存空值
        await this.redisService.set(cacheKey, null, {
          cacheNull: true,
          nullTtl: 60, // 空值只缓存60秒
        });
      }
    }

    return user;
  }

  async updateUser(userId: string, data: any) {
    // 更新数据库
    const user = await this.userRepository.update(userId, data);

    // 删除缓存（下次读取时重新加载）
    await this.redisService.del(`user:${userId}`);

    return user;
  }
}
```

#### getOrSet - 简化缓存逻辑

```typescript
async getUserSimplified(userId: string) {
  const cacheKey = `user:${userId}`;

  // 自动处理：缓存命中、缓存穿透、缓存击穿
  return await this.redisService.getOrSet(
    cacheKey,
    async () => {
      // 只在缓存未命中时执行
      return await this.userRepository.findOne({ where: { id: userId } });
    },
    {
      ttl: 3600,
      jitter: true,
      cacheNull: true  // 防止穿透
    }
  );
}
```

---

### 3. 缓存雪崩防护 (Cache Avalanche Prevention)

**问题**: 大量缓存同时过期，导致请求全部打到数据库。

**解决方案**: TTL随机抖动

```typescript
// ✅ 正确做法：启用jitter
await this.redisService.set(key, data, {
  ttl: 3600,
  jitter: true, // 实际TTL会在 2880s ~ 4320s 之间随机
  jitterRatio: 0.2, // ±20% 范围
});

// ❌ 错误做法：固定TTL
await this.redisService.set(key, data, { ttl: 3600 });
```

**批量预热示例**:

```typescript
async warmupCache() {
  const hotKeys = ['config:global', 'categories:all', 'featured:products'];

  for (const key of hotKeys) {
    // 错开预热时间，避免集中加载
    setTimeout(async () => {
      const data = await this.loadData(key);
      await this.redisService.set(key, data, {
        ttl: 7200,
        jitter: true
      });
    }, Math.random() * 5000); // 0-5秒随机延迟
  }
}
```

---

### 4. 缓存穿透防护 (Cache Penetration Prevention)

**问题**: 查询不存在的数据，缓存永远miss，每次都查数据库。

**解决方案**: 缓存空值 + 布隆过滤器

```typescript
// 方案1: 空值缓存（已集成在getOrSet中）
async getProduct(productId: string) {
  return await this.redisService.getOrSet(
    `product:${productId}`,
    async () => await this.productRepository.findOne(productId),
    {
      cacheNull: true,   // 缓存null值
      nullTtl: 60        // 空值短TTL
    }
  );
}

// 方案2: 布隆过滤器（适合海量数据）
async checkProductExists(productId: string): Promise<boolean> {
  // 先用布隆过滤器快速判断
  const mightExist = await this.redisService.bloomExists('products', productId);

  if (!mightExist) {
    return false; // 一定不存在
  }

  // 可能存在，继续查缓存/数据库
  return await this.getProduct(productId) !== null;
}

async addProductToBloom(productId: string) {
  await this.redisService.bloomAdd('products', productId);
}
```

---

### 5. 缓存击穿防护 (Cache Breakdown Prevention)

**问题**: 热点key过期瞬间，大量并发请求同时查数据库。

**解决方案**: 互斥锁重建缓存

```typescript
// getOrSet内部已实现互斥锁机制
async getHotData(key: string) {
  return await this.redisService.getOrSet(
    key,
    async () => {
      // 只有一个请求会执行这里
      // 其他请求等待并复用结果
      return await this.expensiveQuery();
    },
    {
      ttl: 300,
      jitter: true
    }
  );
}
```

**逻辑过期方案**（高级用法）:

```typescript
interface LogicalExpiringData<T> {
  data: T;
  expireTime: number; // 逻辑过期时间戳
}

async getWithLogicalExpiration(key: string) {
  const cached = await this.redisService.get<LogicalExpiringData<any>>(key);

  if (cached) {
    // 如果即将过期，异步刷新
    if (cached.expireTime - Date.now() < 60000) { // 剩余1分钟
      this.refreshCacheAsync(key); // 不阻塞当前请求
    }
    return cached.data;
  }

  // 缓存未命中，同步加载
  return await this.loadAndSetWithLogicalExp(key);
}
```

---

### 6. 内存拦截器 (Memory Interceptor)

#### 基础用法

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { UseRedisCache, InvalidateCache } from './redis/redis.decorators';
import { RedisCacheInterceptor } from './redis/redis.interceptor';

@Controller('users')
@UseInterceptors(RedisCacheInterceptor)
export class UsersController {
  // ✅ GET请求自动缓存
  @Get(':id')
  @UseRedisCache({ ttl: 300, keyPrefix: 'user:' })
  async getUser(@Param('id') id: string) {
    return await this.userService.findById(id);
  }

  // ✅ 支持忽略特定查询参数
  @Get()
  @UseRedisCache({
    ttl: 60,
    ignoreQueryParams: ['timestamp', 'request_id'],
  })
  async listUsers(@Query() query: any) {
    return await this.userService.findAll(query);
  }

  // ❌ POST/PUT/DELETE不会缓存
  @Post()
  @InvalidateCache('user:*') // 清除所有用户缓存
  async createUser(@Body() data: CreateUserDto) {
    return await this.userService.create(data);
  }

  @Put(':id')
  @InvalidateCache(['user:id', 'users:list']) // 清除特定缓存
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return await this.userService.update(id, data);
  }
}
```

#### 自定义键生成器

```typescript
@Get('profile')
@UseRedisCache({
  ttl: 600,
  customKeyGenerator: (req) => {
    // 根据用户ID生成个性化缓存键
    return `profile:${req.user.id}`;
  }
})
async getProfile(@Req() req: Request) {
  return await this.userService.getProfile(req.user.id);
}
```

---

## 使用示例

### 完整业务场景示例

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class ECommerceService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 商品详情 - 综合应用所有防护机制
   */
  async getProductDetail(productId: string) {
    const cacheKey = `product:detail:${productId}`;

    return await this.redisService.getOrSet(
      cacheKey,
      async () => {
        // 模拟慢查询
        const product = await this.productRepository.findOne(productId);

        if (!product) {
          // 商品不存在，缓存空值防止穿透
          return null;
        }

        // 补充关联数据
        const reviews = await this.reviewRepository.findByProductId(productId);
        const stock = await this.stockRepository.getStock(productId);

        return {
          ...product,
          reviews,
          stock,
        };
      },
      {
        ttl: 1800, // 30分钟
        jitter: true, // 防雪崩
        cacheNull: true, // 防穿透
        nullTtl: 120, // 空值2分钟
      },
    );
  }

  /**
   * 秒杀活动 - 使用分布式锁防止超卖
   */
  async flashSale(productId: string, userId: string) {
    const lockKey = `flash_sale:${productId}`;

    return await this.redisService.useLock(
      lockKey,
      async () => {
        // 检查库存
        const stock = await this.stockRepository.getStock(productId);
        if (stock <= 0) {
          throw new Error('库存不足');
        }

        // 检查是否重复购买
        const purchaseKey = `flash_sale_purchase:${productId}:${userId}`;
        const alreadyPurchased = await this.redisService.get(purchaseKey);
        if (alreadyPurchased) {
          throw new Error('每人限购一件');
        }

        // 扣减库存
        await this.stockRepository.decreaseStock(productId, 1);

        // 标记已购买（24小时过期）
        await this.redisService.set(purchaseKey, true, { ttl: 86400 });

        // 创建订单
        return await this.orderRepository.create({
          productId,
          userId,
          type: 'flash_sale',
        });
      },
      { ttl: 3000 }, // 锁3秒，足够完成事务
    );
  }

  /**
   * 热门排行榜 - 定时刷新 + 缓存
   */
  async getTopProducts(category: string) {
    const cacheKey = `ranking:${category}:top`;

    // 优先返回缓存
    let ranking = await this.redisService.get(cacheKey);

    if (!ranking) {
      // 使用锁防止击穿
      ranking = await this.redisService.useLock(
        `mutex:${cacheKey}`,
        async () => {
          // 双重检查
          ranking = await this.redisService.get(cacheKey);
          if (ranking) return ranking;

          // 计算排行榜
          ranking = await this.calculateRanking(category);

          // 设置缓存（1小时，带抖动）
          await this.redisService.set(cacheKey, ranking, {
            ttl: 3600,
            jitter: true,
          });

          return ranking;
        },
        { ttl: 5000 },
      );
    }

    return ranking;
  }

  /**
   * 用户会话管理
   */
  async createSession(userId: string, token: string) {
    const sessionKey = `session:${token}`;

    await this.redisService.set(
      sessionKey,
      { userId },
      {
        ttl: 86400 * 7, // 7天
      },
    );
  }

  async validateSession(token: string): Promise<string | null> {
    const sessionKey = `session:${token}`;
    const session = await this.redisService.get<{ userId: string }>(sessionKey);

    if (!session) {
      return null;
    }

    // 续期
    await this.redisService.set(sessionKey, session, { ttl: 86400 * 7 });

    return session.userId;
  }

  async invalidateSession(token: string) {
    await this.redisService.del(`session:${token}`);
  }
}
```

---

## 最佳实践

### ✅ DO - 推荐做法

1. **始终使用jitter防止雪崩**

   ```typescript
   await redisService.set(key, value, { jitter: true });
   ```

2. **敏感数据加密后缓存**

   ```typescript
   const encrypted = encrypt(sensitiveData);
   await redisService.set(key, encrypted);
   ```

3. **合理设置TTL**
   - 配置数据：长TTL（几小时到几天）
   - 用户数据：中等TTL（几分钟到几小时）
   - 临时数据：短TTL（几秒到几分钟）

4. **使用useLock自动管理锁**

   ```typescript
   await redisService.useLock(key, async () => {
     /* logic */
   });
   ```

5. **监控缓存命中率**
   ```typescript
   // 添加日志或指标收集
   if (!cached) {
     logger.warn(`Cache miss: ${key}`);
   }
   ```

### ❌ DON'T - 避免做法

1. **不要缓存大对象**

   ```typescript
   // ❌ 避免
   await redisService.set('huge_list', hugeArray);

   // ✅ 分页或限制大小
   await redisService.set('page_1', pageData);
   ```

2. **不要忘记释放锁**

   ```typescript
   // ❌ 危险
   const lockId = await redisService.tryLock(key);
   doSomething(); // 如果异常，锁永远不会释放

   // ✅ 使用try-finally或useLock
   await redisService.useLock(key, async () => doSomething());
   ```

3. **不要在循环中频繁操作Redis**

   ```typescript
   // ❌ 性能差
   for (const item of items) {
     await redisService.set(item.key, item.value);
   }

   // ✅ 使用pipeline或批量操作
   ```

4. **不要缓存实时性要求极高的数据**

   ```typescript
   // ❌ 不适合
   await redisService.set('current_stock', stock); // 股票价格

   // ✅ 适合
   await redisService.set('daily_summary', summary); // 日报表
   ```

---

## 性能调优建议

### 1. 连接池配置

```typescript
// 在生产环境中考虑连接池
CacheModule.registerAsync({
  useFactory: () => ({
    store: 'redis',
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    // 连接池配置
    pool: {
      min: 5,
      max: 20,
    },
  }),
});
```

### 2. 序列化优化

```typescript
// 对于高频访问的数据，使用更高效的序列化
import { pack, unpack } from 'msgpackr';

await redisService.set(key, pack(data));
const data = unpack(await redisService.get(key));
```

### 3. 缓存分层

```typescript
// L1: 内存缓存（极快，但容量小）
// L2: Redis缓存（快，容量大）
const l1Cache = new Map();

async function getWithTwoLevelCache(key: string) {
  // L1
  if (l1Cache.has(key)) {
    return l1Cache.get(key);
  }

  // L2
  const value = await redisService.get(key);
  if (value) {
    l1Cache.set(key, value);
    setTimeout(() => l1Cache.delete(key), 60000); // 1分钟后清理L1
  }

  return value;
}
```

---

## 故障排查

### 常见问题

**Q: 缓存一直不生效？**
A: 检查Redis连接是否正常，查看日志中的错误信息。

**Q: 分布式锁死锁？**
A: 确保设置了合理的ttl，并使用useLock自动释放。

**Q: 缓存雪崩？**
A: 确认启用了jitter选项，检查TTL设置是否过于集中。

**Q: 内存占用过高？**
A: 检查是否有未设置TTL的缓存项，调整REDIS_MAX_ITEMS配置。

---

## 参考资料

- [Redis官方文档](https://redis.io/documentation)
- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)
- [分布式锁最佳实践](https://redis.io/topics/distlock)
