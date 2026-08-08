# `seckill.service.ts` 技术文档

## 1. 文件概述

`seckill.service.ts` 是典型的高并发秒杀业务核心服务层实现。基于提取的结构特征（尤其是 `onModuleInit` 生命周期钩子），可明确推断该文件运行于 **NestJS** 框架环境中。

该文件的核心职责是：

- 管理秒杀活动的生命周期与状态流转
- 实现高并发场景下的库存扣减、防超卖与幂等控制
- 协调缓存（Redis）、数据库（ORM/QueryRunner）与消息队列（MQ）的协同工作
- 提供模块级预热与依赖注入管理

整体架构遵循 **服务层隔离** 与 **读写分离/异步解耦** 原则，是秒杀链路中承上启下的关键节点。

---

## 2. 核心类说明

### `SeckillService`

| 属性         | 说明                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| **定位**     | 秒杀业务逻辑聚合类，单例模式（NestJS 默认 Provider 作用域）                               |
| **职责**     | 封装秒杀请求校验、库存原子扣减、订单异步生成、异常降级与状态反馈                          |
| **设计特征** | 依赖注入驱动；结合生命周期钩子实现数据预热；核心方法需具备高吞吐与低延迟特性              |
| **典型依赖** | `SeckillRepository` / `RedisService` / `OrderService` / `EventEmitter2` / `LoggerService` |

---

## 3. 方法/函数详细说明

> 💡 注：以下参数签名基于秒杀领域模型与 NestJS 规范进行合理推断，实际以源码为准。

### 3.1 `constructor`

```typescript
constructor(
  private readonly seckillRepo: SeckillRepository,
  private readonly redisService: RedisService,
  private readonly orderService: OrderService,
  private readonly eventEmitter: EventEmitter2,
  private readonly logger: Logger
)
```

- **功能说明**：依赖注入入口，初始化服务运行所需的基础设施组件。
- **参数解释**：
  - `seckillRepo`：数据访问层，负责秒杀活动与库存的持久化操作。
  - `redisService`：缓存客户端，用于库存预扣、分布式锁、限流计数。
  - `orderService`：订单服务，用于异步创建订单或同步落库。
  - `eventEmitter`：进程内事件总线，用于解耦秒杀成功后的后续动作（如发券、通知）。
  - `logger`：结构化日志组件，记录核心链路耗时与异常堆栈。
- **业务意图**：确保服务启动时所有外部依赖已就绪，避免运行时 `undefined` 调用；为后续高并发方法提供线程安全/进程安全的上下文。

---

### 3.2 `onModuleInit`

```typescript
async onModuleInit(): Promise<void>
```

- **功能说明**：NestJS 生命周期钩子，在模块完全初始化后自动触发。
- **参数解释**：无（由框架底层调用）。
- **业务意图**：
  - **库存预热**：扫描即将开始的秒杀活动，将库存快照、限购规则、商品基础信息加载至 Redis。
  - **状态校验**：检查活动配置完整性，标记异常活动为 `DISABLED` 防止脏数据流入。
  - **连接池/计数器初始化**：预创建 Redis 连接、初始化限流器（如 `rate-limiter-flexible`）或分布式锁客户端。
- **架构价值**：将冷启动开销前置，避免秒杀高峰期出现缓存穿透或数据库直连，是保障 `QPS` 稳定性的关键步骤。

---

### 3.3 `executeSeckill`

```typescript
async executeSeckill(
  seckillId: string,
  userId: string,
  token?: string,
  options?: ExecuteSeckillOptions
): Promise<SeckillResult>
```

- **功能说明**：秒杀核心执行入口，处理用户请求并完成库存扣减与状态返回。
- **参数解释**：
  - `seckillId`：秒杀活动唯一标识。
  - `userId`：发起请求的用户标识。
  - `token`：可选，用于风控校验或设备指纹绑定。
  - `options`：扩展配置，如 `retryCount`, `timeout`, `channel`（APP/H5/小程序）。
- **业务意图**：
  1. **前置校验**：活动状态、时间窗口、用户黑名单/限购次数。
  2. **库存扣减**：通过 Redis `DECR` 或 Lua 脚本实现原子扣减，防止超卖。
  3. **幂等控制**：基于 `userId + seckillId` 生成唯一键，拦截重复请求。
  4. **异步落单**：扣减成功后发送 MQ 消息或触发事件，由消费者异步创建订单，快速返回前端。
  5. **降级策略**：库存不足或系统过载时，返回友好提示或排队状态。
- **关键实现建议**：
  - 使用 `try-catch` 包裹核心逻辑，区分业务异常（库存不足）与系统异常（Redis 宕机）。
  - 核心扣减逻辑建议封装为独立方法，便于单元测试与压测。
  - 返回结构应包含 `status`（SUCCESS/FAIL/QUEUE）、`message`、`traceId` 便于链路追踪。

---

## 4. 推断的接口与类型定义（补充）

> 提取数据中未显式包含接口/类型，但基于秒杀架构规范，建议配套以下数据结构：

```typescript
// 秒杀执行配置
interface ExecuteSeckillOptions {
  retryCount?: number;
  timeout?: number;
  channel?: "APP" | "H5" | "MINI_PROGRAM";
}

// 秒杀结果响应
interface SeckillResult {
  code: number;
  message: string;
  data?: {
    orderId?: string;
    queuePosition?: number;
    remainingStock?: number;
  };
  traceId: string;
}

// 库存快照（Redis 存储结构）
interface SeckillStockSnapshot {
  seckillId: string;
  totalStock: number;
  availableStock: number;
  startTime: number;
  endTime: number;
  limitPerUser: number;
}
```

---

## 5. 架构设计与最佳实践建议

| 维度         | 建议方案                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **防超卖**   | Redis Lua 脚本原子扣减 + 数据库乐观锁（`UPDATE stock SET num = num - 1 WHERE id = ? AND num > 0`）双保险 |
| **高并发**   | 网关层限流 → 服务层令牌桶 → Redis 预扣 → MQ 异步下单 → 数据库最终一致性                                  |
| **幂等性**   | 请求签名 + Redis `SETNX` 分布式锁 + 数据库唯一索引（`user_id, seckill_id`）                              |
| **可观测性** | 集成 `OpenTelemetry` 或 `NestJS Interceptor` 记录 `executeSeckill` 耗时、成功率、缓存命中率              |
| **容灾降级** | 配置 `fallback` 策略：Redis 不可用时切换至本地内存计数器（短期）或返回“系统繁忙，请稍后重试”             |

---

📌 **文档维护说明**  
本文档基于静态结构提取生成，实际业务逻辑、参数签名与异常处理策略请以源码及单元测试为准。建议在 CI/CD 流水线中集成 `TypeDoc` 或 `Compodoc` 实现文档自动化同步。
