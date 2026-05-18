# Redis Module - 快速开始指南

## 🚀 5分钟上手

### 1. 配置环境变量

在 `.env` 文件中添加：

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 如果有密码
REDIS_DB=0
REDIS_TTL=3600
```

### 2. 导入模块（已完成）

RedisModule已经在 `app.module.ts` 中导入，无需额外配置。

### 3. 基础使用示例

#### 示例1: 简单缓存

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class MyService {
  constructor(private readonly redisService: RedisService) {}

  async getData() {
    // 设置缓存（5分钟，带防雪崩抖动）
    await this.redisService.set(
      'my:key',
      { data: 'value' },
      {
        ttl: 300,
        jitter: true,
      },
    );

    // 获取缓存
    const data = await this.redisService.get('my:key');
    return data;
  }
}
```

#### 示例2: 防止缓存穿透和击穿

```typescript
async getUser(userId: string) {
  return await this.redisService.getOrSet(
    `user:${userId}`,
    async () => {
      // 只在缓存miss时执行
      return await this.userRepository.findOne(userId);
    },
    {
      ttl: 3600,
      jitter: true,
      cacheNull: true  // 防止穿透
    }
  );
}
```

#### 示例3: 分布式锁

```typescript
async processOrder(orderId: string) {
  return await this.redisService.useLock(
    `lock:order:${orderId}`,
    async () => {
      // 自动加锁和释放锁
      return await this.doProcessOrder(orderId);
    },
    { ttl: 5000 }
  );
}
```

#### 示例4: 自动缓存API响应

```typescript
import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { UseRedisCache } from './redis/redis.decorators';
import { RedisCacheInterceptor } from './redis/redis.interceptor';

@Controller('products')
@UseInterceptors(RedisCacheInterceptor)
export class ProductsController {
  @Get(':id')
  @UseRedisCache({ ttl: 300 })
  async getProduct(@Param('id') id: string) {
    return await this.productsService.findById(id);
  }
}
```

### 4. 测试API

启动应用后，访问演示接口：

```bash
# 基础缓存
curl http://localhost:3000/redis-demo/basic-cache

# getOrSet示例
curl http://localhost:3000/redis-demo/get-or-set/123

# 分布式锁
curl -X POST http://localhost:3000/redis-demo/lock/inventory/product1

# 自动缓存
curl http://localhost:3000/redis-demo/auto-cache/users/1

# 清除缓存
curl -X PUT http://localhost:3000/redis-demo/invalidate/user/1
```

---

## 📚 更多文档

- [完整使用指南](./README.md) - 详细的功能说明和最佳实践
- [API参考](./index.ts) - 所有导出的接口和类型

---

## 💡 核心优势

✅ **开箱即用** - 已集成到项目中，直接使用  
✅ **生产级防护** - 防雪崩、防穿透、防击穿  
✅ **简单易用** - 一行代码实现分布式锁  
✅ **自动缓存** - 装饰器自动缓存GET请求  
✅ **类型安全** - 完整的TypeScript支持

---

## 🔧 常见问题

**Q: Redis连接失败？**  
A: 检查 `.env` 中的 `REDIS_HOST` 和 `REDIS_PORT` 配置是否正确。

**Q: 如何禁用某个功能？**  
A: 在调用方法时传入相应参数，例如 `{ jitter: false }` 禁用抖动。

**Q: 如何监控缓存性能？**  
A: 可以集成Prometheus等监控工具，记录缓存命中率和响应时间。

---

## 🎯 下一步

1. 阅读 [完整使用指南](./README.md) 了解所有功能
2. 查看 [redis-demo.controller.ts](./redis-demo.controller.ts) 学习实际用例
3. 根据业务需求调整缓存策略和TTL配置
