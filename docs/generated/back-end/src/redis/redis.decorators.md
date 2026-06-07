# redis.decorators.ts 技术文档

## 文件概述

`redis.decorators.ts` 是一个 TypeScript 模块，包含了用于处理 Redis 缓存和锁的装饰器。这些装饰器帮助开发者在代码中轻松地集成 Redis 数据存储和锁定功能。

### 类、接口、类型和函数说明

1. **UseRedisCache**
   - **描述**: 该装饰器允许你在类或方法上使用 Redis 缓存。
   - **参数**:
     - `key` (string): 缓存键名，用于标识缓存项的唯一性。
     - `ttl` (number): 缓存过期时间（秒）。

2. **InvalidateCache**
   - **描述**: 该装饰器允许你在类或方法上使用 Redis 锁机制来防止并发问题。
   - **参数**:
     - `lockKey` (string): 锁的键名，用于标识锁项的唯一性。
     - `timeout` (number): 锁超时时间（秒）。

3. **UseRedisLock**
   - **描述**: 该装饰器允许你在类或方法上使用 Redis 锁机制来防止并发问题。
   - **参数**:
     - `lockKey` (string): 锁的键名，用于标识锁项的唯一性。
     - `timeout` (number): 锁超时时间（秒）。

## 示例代码

```typescript
import { UseRedisCache, InvalidateCache } from 'redis.decorators';

// 使用 UseRedisCache 装饰器
class UserService {
  @UseRedisCache(key: 'user', ttl: 60)
  async getUserById(userId: number) {
    // 模拟从数据库中获取用户信息的逻辑
    const user = await this.database.getUserById(userId);
    return user;
  }
}

// 使用 InvalidateCache 装饰器
class OrderService {
  @InvalidateCache(lockKey: 'order', timeout: 30)
  async placeOrder(orderId: number) {
    // 模拟处理订单逻辑，防止并发问题
    await this.orderRepository.placeOrder(orderId);
    return true;
  }
}

// 使用 UseRedisLock 装饰器
class PaymentService {
  @UseRedisLock(lockKey: 'payment', timeout: 60)
  async processPayment(paymentId: number) {
    // 模拟处理支付逻辑，防止并发问题
    await this.paymentRepository.processPayment(paymentId);
    return true;
  }
}
```

### 总结

`redis.decorators.ts` 是一个功能强大的模块，通过装饰器简化了在 TypeScript 中集成 Redis 缓存和锁的功能。它提供了清晰的接口和参数说明，使得开发者能够轻松地将这些功能添加到他们的项目中。
