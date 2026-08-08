# `redis-demo.controller.ts` 技术文档

## 📄 文件概述

`redis-demo.controller.ts` 是一个基于 **NestJS** 框架的控制器模块，核心目标是提供一套完整的 **Redis 集成演示与能力暴露层**。该文件通过 HTTP 接口封装了 Redis 的常用操作模式，涵盖基础缓存读写、缓存一致性策略、分布式锁机制、高级数据结构（布隆过滤器）、缓存可观测性以及高并发业务场景（秒杀/抢购）。

**定位**：教学演示 / 内部压测 / 微服务 Redis 能力统一网关  
**技术栈推断**：TypeScript + NestJS + `@nestjs/cache-manager` / `ioredis` / `redis` 客户端

---

## 🏗️ 核心类与依赖推断

### `RedisDemoController` (Line 29)

- **职责**：作为 HTTP 路由入口，处理所有与 Redis 演示相关的请求。
- **依赖注入推断**：`constructor` 中大概率注入了以下服务之一：
  - `RedisService` / `CacheManager`：封装了底层 Redis 客户端的通用操作。
  - `@InjectRedisClient()`：直接注入 `ioredis` 或 `redis` 实例。
  - `Logger`：用于记录缓存命中/未命中及锁竞争日志。
- **路由前缀推断**：`@Controller('redis-demo')` 或 `@Controller('api/redis')`

---

## 🔌 方法/API 详细说明

> 📌 **注**：以下参数与返回类型为架构师基于命名规范、Redis 最佳实践及 NestJS 惯例的**合理推断**。实际签名请以源码为准。

### 1. `constructor` (Line 30)

- **功能说明**：控制器初始化入口，完成依赖注入与客户端连接校验。
- **参数推断**：`redisService: RedisService`, `logger: Logger`
- **业务意图**：确保 Redis 客户端在应用启动时已就绪，避免运行时连接异常。

### 2. `basicCacheExample` (Line 41)

- **功能说明**：演示 Redis 最基础的 `SET` / `GET` 操作。
- **参数推断**：`key: string`, `value: any` (或无参，使用硬编码演示)
- **业务意图**：验证 Redis 连通性，展示字符串类型的基础读写流程。
- **返回推断**：`{ success: boolean, cachedValue: any }`

### 3. `getOrSetExample` (Line 67)

- **功能说明**：实现 **Cache-Aside（旁路缓存）** 模式。先查缓存，命中则返回；未命中则查询数据源，写入缓存后返回。
- **参数推断**：`key: string`, `fetchFromDb: () => Promise<any>` 或 `resourceId: string`
- **业务意图**：解决读多写少场景的性能瓶颈，降低数据库压力。
- **架构提示**：需处理缓存击穿问题（可结合互斥锁或逻辑过期）。

### 4. `distributedLockExample` (Line 107)

- **功能说明**：演示基于 `SETNX` 或 Redlock 算法的分布式锁获取与释放。
- **参数推断**：`lockKey: string`, `ttl: number` (秒)
- **业务意图**：在分布式/微服务架构中保证临界区代码的原子性执行，防止并发冲突。
- **架构提示**：强调锁的 `value` 需具备唯一性（如 UUID），释放时需校验归属。

### 5. `autoCacheExample` (Line 144)

- **功能说明**：演示声明式自动缓存，可能结合 NestJS 拦截器或自定义装饰器实现。
- **参数推断**：`key: string`, `ttl: number`
- **业务意图**：简化业务代码，将缓存逻辑与核心逻辑解耦，提升开发效率。
- **架构提示**：通常配合 `@Cacheable()` 或 `@UseInterceptors(CacheInterceptor)` 使用。

### 6. `invalidateCacheExample` (Line 161)

- **功能说明**：演示缓存失效/删除操作。
- **参数推断**：`key: string`
- **业务意图**：在数据发生更新/删除时，主动清除旧缓存，保障 **缓存与数据库的最终一致性**。
- **架构提示**：生产环境建议采用 `Cache-Aside` 的 `先更新DB，再删除缓存` 策略。

### 7. `batchDeleteExample` (Line 177)

- **功能说明**：演示批量删除缓存键。
- **参数推断**：`keys: string[]` 或 `pattern: string` (如 `user:*`)
- **业务意图**：清理冗余数据、模块级缓存刷新或定时任务清理。
- **架构提示**：若使用 `KEYS` 命令需警惕阻塞主线程，推荐 `SCAN` + `DEL` 异步分批删除。

### 8. `bloomFilterCheck` (Line 193)

- **功能说明**：检查指定元素是否存在于布隆过滤器中。
- **参数推断**：`filterName: string`, `item: string`
- **业务意图**：利用概率型数据结构进行 **缓存穿透防御**。若过滤器返回 `false`，则元素绝对不存在，直接拦截请求。
- **架构提示**：需接受极低概率的误判率（False Positive），不可用于绝对精确校验。

### 9. `bloomFilterAdd` (Line 205)

- **功能说明**：将元素添加至布隆过滤器。
- **参数推断**：`filterName: string`, `item: string`
- **业务意图**：在系统初始化或数据同步阶段，将合法数据 ID 预加载至过滤器，构建防穿透屏障。

### 10. `manualLockExample` (Line 219)

- **功能说明**：演示手动获取与释放锁的完整生命周期。
- **参数推断**：`lockKey: string`, `businessId: string`
- **业务意图**：教育开发者掌握 `try...finally` 模式，确保异常发生时锁仍能正确释放，避免死锁。
- **架构提示**：手动锁适用于复杂业务逻辑，但需严格把控释放时机。

### 11. `blockingLockExample` (Line 253)

- **功能说明**：演示阻塞式/重试式锁获取机制。
- **参数推断**：`lockKey: string`, `timeout: number`, `retryInterval: number`
- **业务意图**：在高竞争场景下，线程不立即失败，而是等待锁释放或达到超时阈值，提升系统吞吐量。
- **架构提示**：需设置合理的 `timeout` 防止线程饥饿，可结合 `Redlock` 或 `Redisson` 的 `tryLock`。

### 12. `cacheStats` (Line 289)

- **功能说明**：获取 Redis 缓存统计信息或服务器状态。
- **参数推断**：无（或 `metricType: string`）
- **业务意图**：暴露缓存命中率、内存使用、连接数等指标，用于 **可观测性监控** 与性能调优。
- **架构提示**：生产环境建议对接 Prometheus + Grafana，而非直接暴露 HTTP 接口。

### 13. `grabOrder` (Line 311)

- **功能说明**：模拟高并发“秒杀/抢购”业务场景。
- **参数推断**：`orderId: string`, `userId: string`
- **业务意图**：演示如何利用 Redis 原子操作（`DECR`）、分布式锁或 Lua 脚本实现 **库存扣减防超卖**，并结合消息队列异步落库。
- **架构提示**：核心链路应为：`Redis 预扣库存 -> 成功则发 MQ -> 消费者异步写 DB -> 失败则回滚/提示`。

---

## 💡 架构设计模式与业务意图总结

| 模块分类       | 涉及方法                                                             | 核心设计模式            | 解决的业务痛点                     |
| :------------- | :------------------------------------------------------------------- | :---------------------- | :--------------------------------- |
| **基础缓存**   | `basicCacheExample`, `getOrSetExample`, `autoCacheExample`           | Cache-Aside, 装饰器模式 | 降低 DB 查询延迟，提升读性能       |
| **一致性维护** | `invalidateCacheExample`, `batchDeleteExample`                       | 失效策略, 批量操作模式  | 保证缓存与源数据一致性，清理脏数据 |
| **并发控制**   | `distributedLockExample`, `manualLockExample`, `blockingLockExample` | 分布式锁, 互斥模式      | 防止并发冲突、数据竞态条件         |
| **高级结构**   | `bloomFilterCheck`, `bloomFilterAdd`                                 | 概率型数据结构          | 防御缓存穿透，节省无效 DB 查询     |
| **可观测性**   | `cacheStats`                                                         | 指标暴露模式            | 监控缓存健康度，辅助容量规划       |
| **高并发业务** | `grabOrder`                                                          | 原子操作 + 异步削峰     | 解决秒杀超卖、DB 瞬时高压问题      |

---

## ⚠️ 生产环境最佳实践建议（架构师视角）

1. **锁的安全边界**：所有分布式锁必须设置 `TTL`，且业务执行时间应 `< TTL`。推荐使用 `Redisson` 的看门狗（Watchdog）机制自动续期。
2. **布隆过滤器容量规划**：初始化时需根据预估数据量与可接受误判率计算哈希函数数量与位数组大小，避免频繁重建。
3. **批量删除性能**：严禁在生产环境使用 `KEYS *`。必须使用 `SCAN` 游标迭代，或采用逻辑过期+后台异步清理。
4. **抢购链路降级**：`grabOrder` 接口应配合网关层限流（如令牌桶）、Redis 库存预热、以及 MQ 异步落库。同步返回结果应区分“排队中”与“失败”。
5. **缓存异常处理**：所有 Redis 调用需包裹 `try-catch`，并提供降级策略（如直接查 DB 或返回默认值），避免 Redis 宕机导致服务雪崩。
6. **类型安全**：建议为所有缓存 Key 定义常量枚举或 Zod/Class-Validator 校验 DTO，避免硬编码字符串导致键冲突。

---

📝 _本文档基于提供的 AST 结构数据生成，参数签名与返回类型为架构经验推断。实际开发请以源码实现与团队规范为准。_
