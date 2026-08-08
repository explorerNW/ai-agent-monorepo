# `redis.service.ts` 技术架构文档

## 1. 文件概述

`redis.service.ts` 是一个面向高并发场景的 **Redis 客户端封装服务**。该文件采用 TypeScript 编写，遵循依赖注入与服务层分离的设计原则（常见于 NestJS 或现代 Node.js 架构）。其核心目标是：

- **统一门面**：屏蔽底层 Redis 客户端（如 `ioredis` / `redis`）的差异，提供类型安全、易用的 API。
- **并发控制**：内置完整的分布式锁实现，支持非阻塞尝试、阻塞重试与上下文自动释放。
- **性能优化**：提供原子性 `getOrSet` 防缓存击穿，集成 RedisBloom 模块解决缓存穿透与海量数据去重。
- **工程化治理**：统一处理序列化/反序列化、TTL 管理、连接健康检查与错误降级。

---

## 2. 核心类与类型说明

### `RedisService` (Class)

| 属性         | 说明                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **定位**     | Redis 交互的统一服务门面，管理连接生命周期与命令封装                                              |
| **设计意图** | 解耦业务逻辑与底层 Redis 实现；集中处理网络重试、序列化、锁竞争与异常边界；支持单例模式复用连接池 |
| **依赖推断** | 底层依赖 `ioredis` 或 `@nestjs/microservices` 的 Redis 模块；配置项可能通过 `ConfigService` 注入  |

> 📌 **注**：提取结构中未显式声明接口/类型，但基于 TypeScript 最佳实践，建议内部定义以下类型：
>
> ```ts
> interface RedisConfig {
>   host: string;
>   port: number;
>   password?: string;
>   db?: number;
>   retryStrategy?: (times: number) => number | null;
>   keyPrefix?: string;
>   serializer?: (v: any) => string;
> }
> type LockOptions = {
>   ttl: number;
>   retryInterval?: number;
>   maxRetries?: number;
> };
> ```

---

## 3. 方法详细设计

### 3.1 基础键值操作

| 方法          | 签名推断                                                                                                | 业务意图与说明                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `constructor` | `(config: RedisConfig) => void`                                                                         | 初始化 Redis 客户端，配置连接池、重试策略、键前缀与序列化器。建立连接健康检查与就绪状态监听。 |
| `get`         | `(key: string) => Promise<string \| null>`                                                              | 基础缓存读取。自动处理键前缀拼接、反序列化与空值过滤。适用于常规缓存命中场景。                |
| `set`         | `(key: string, value: any, ttl?: number, options?: { nx?: boolean, xx?: boolean }) => Promise<boolean>` | 写入缓存。支持 TTL 防内存泄漏；`nx`/`xx` 选项支持条件写入（如 `SETNX`）。值对象自动序列化。   |
| `del`         | `(key: string) => Promise<number>`                                                                      | 删除单个键。返回 `1` 表示成功，`0` 表示键不存在。用于缓存失效或状态清理。                     |
| `delMany`     | `(keys: string[]) => Promise<number>`                                                                   | 批量删除。底层建议使用 `UNLINK` 异步删除避免阻塞主线程，提升大批量清理性能。                  |

### 3.2 分布式锁机制

| 方法          | 签名推断                                                                  | 业务意图与说明                                                                                                                              |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `tryLock`     | `(key: string, ttl: number, lockId?: string) => Promise<string \| null>`  | **非阻塞尝试加锁**。基于 `SET key lockId NX EX ttl` 或 Lua 脚本实现。成功返回 `lockId`，失败返回 `null`。适用于短时资源竞争。               |
| `releaseLock` | `(key: string, lockId: string) => Promise<boolean>`                       | **安全释放锁**。严格校验 `lockId` 匹配，防止误删其他客户端的锁。必须使用 Lua 保证原子性。                                                   |
| `lock`        | `(key: string, ttl: number, options?: LockOptions) => Promise<string>`    | **阻塞式加锁**。内置指数退避重试机制，适用于必须获取锁才能继续的核心流程（如订单扣减、库存预占）。                                          |
| `useLock`     | `<T>(key: string, ttl: number, executor: () => Promise<T>) => Promise<T>` | **上下文管理器**。自动完成 `lock → executor → releaseLock` 生命周期。即使 `executor` 抛出异常，也保证锁被安全释放，大幅降低开发者心智负担。 |

### 3.3 高级缓存与原子操作

| 方法       | 签名推断                                                                                                               | 业务意图与说明                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getOrSet` | `<T>(key: string, factory: () => Promise<T>, ttl: number, options?: { staleWhileRevalidate?: boolean }) => Promise<T>` | **原子性“获取或设置”**。解决缓存击穿与并发重复计算问题。底层通常使用 Lua 脚本实现 `GET → SETNX → 异步回填`，支持 `staleWhileRevalidate` 返回旧值并后台更新。 |

### 3.4 布隆过滤器集成

| 方法          | 签名推断                                                 | 业务意图与说明                                                                                                                                |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `bloomExists` | `(filterName: string, item: string) => Promise<boolean>` | 检查元素是否存在于布隆过滤器中。返回 `false` 绝对不存在；返回 `true` 可能存在（允许假阳性）。常用于黑名单拦截、缓存穿透防护、海量 ID 预过滤。 |
| `bloomAdd`    | `(filterName: string, item: string) => Promise<boolean>` | 向指定布隆过滤器添加元素。需确保 Redis 已启用 `RedisBloom` 模块，且过滤器已通过 `BF.RESERVE` 初始化（设定容量与误判率）。                     |

### 3.5 工具方法

| 方法             | 签名推断                                    | 业务意图与说明                                                                                      |
| ---------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `generateLockId` | `(options?: { length?: number }) => string` | 生成全局唯一锁标识符。通常基于 `crypto.randomUUID()` 或高熵随机字符串，确保锁的不可预测性与安全性。 |

---

## 4. 架构设计原则与最佳实践（资深架构师建议）

### 🔒 分布式锁可靠性保障

- **Lua 脚本强制使用**：`tryLock` 与 `releaseLock` 必须通过 `EVAL` 执行 Lua 脚本，避免 `SETNX` + `EXPIRE` 两步操作在 Redis 主从切换或高负载下产生锁失效或死锁。
- **看门狗机制（可选）**：对于长耗时任务，建议在 `useLock` 内部实现后台续期（Watchdog），防止业务未执行完锁已过期。

### ⚡ 性能与稳定性优化

- **连接池复用**：严禁在请求级别创建/销毁 Redis 实例。应通过 DI 容器管理单例连接，配置合理的 `maxRetriesPerRequest` 与 `lazyConnect`。
- **序列化策略**：统一使用 `JSON.stringify/parse` 或 `msgpack`。建议在 Service 层透明处理，业务方直接传递对象。
- **批量操作优化**：`delMany` 建议分片执行（如每批 500 个），避免单次命令过大触发 Redis 慢查询或网络包超限。

### 🛡️ 布隆过滤器工程化

- **初始化前置**：布隆过滤器需在服务启动时调用 `BF.RESERVE filterName capacity error_rate`，运行时不可动态扩容。
- **误判率权衡**：通用场景建议 `error_rate: 0.01`，容量按预期数据量的 1.2~1.5 倍预留，避免频繁扩容导致数据迁移。

### 📦 错误处理与降级

- 统一封装 `RedisServiceError`，区分 `ConnectionError`、`TimeoutError`、`CommandError`。
- 核心链路建议配合熔断器（如 `opossum` 或 `@nestjs/circuit-breaker`），在 Redis 不可用时自动降级至本地缓存或数据库直查。

---

> 📝 **文档版本**：v1.0  
> 🛠️ **适用框架**：NestJS / Express / Fastify + TypeScript  
> 🔍 **维护建议**：定期审查 Redis 慢查询日志，监控 `used_memory` 与 `evicted_keys`，结合 `getOrSet` 与布隆过滤器构建多级缓存架构。
