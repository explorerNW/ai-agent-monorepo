### 📄 文件元信息

- **文件路径**: `back-end/src/redis/redis.service.ts`
- **模块职责**: Redis 服务提供连接管理、锁机制及 Bloom Filter 缓存功能的核心支持组件
- **关联模块**: redis-client, lock-manager，用于跨模块的分布式事务与并发控制

### 📦 API 知识条目

#### `constructor`成员全限定名

- **语义标签**: [构造函数], [初始化参数], [线程安全]
- **完整签名**: ```typescript
  class RedisService {
  constructor(
  private redisClient: RedisClient,
  private lockManager: LockManager,
  private bloomFilter: BloomFilter<string> = new DefaultBloomFilter(),
  private maxRetries: number = 3,
  private timeoutMs: number = 10000
  ) {}
  }

````
- **设计意图**: RedisService 用于初始化连接管理、锁机制及缓存功能，确保服务在启动时具备基础并发控制能力。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| redisClient | RedisClient | true | - | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |
| lockManager | LockManager | false | { maxRetries: number, timeoutMs } | 线程安全锁管理机制，支持并发控制与超时保护。 |
| bloomFilter | BloomFilter<string> = new DefaultBloomFilter() | true | - | Redis 分布式缓存过滤器，用于快速查询热点数据并避免重复计算。 |
| maxRetries | number | false | 3 | 最大重试次数限制，防止无限循环导致服务崩溃。 |
| timeoutMs | number | false | 10000ms | 请求超时时间阈值，确保响应及时性。 |

- **返回值/实例方法**: `constructor`无直接返回值，但通过构造函数参数传递 RedisClient、锁机制及缓存过滤器等依赖项。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败或 timeoutMs 设置不当将触发错误处理逻辑。

#### `get`函数全限定名
```typescript
function get(key: string): Promise<RedisObject | null> {
    return new Promise((resolve, reject) => {
        if (key === 'default') resolve(null); else redisClient.get(key).then(resolve, reject);
    });
}
````

- **设计意图**: 获取 Redis 对象状态，支持异步返回与错误处理机制。
- **参数/属性契约**:

| 名称        | 类型        | 可选  | 约束/默认值                       | 语义说明                                             |
| ----------- | ----------- | ----- | --------------------------------- | ---------------------------------------------------- |
| key         | string      | true  | -                                 | 请求键名，用于查询 Redis 对象状态或缓存数据。        |
| redisClient | RedisClient | false | { maxRetries: number, timeoutMs } | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |

- **返回值/实例方法**: `get`返回 Promise<RedisObject>，支持异步获取状态或错误处理逻辑；若 key 为 'default'则直接返回 null。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `set`函数全限定名

```typescript
function set(key: string, value: any): Promise<void> {
  return new Promise((resolve) => {
    if (key === "default") resolve();
    else redisClient.set(key).then(resolve);
  });
}
```

- **设计意图**: 设置 Redis 对象状态，支持异步写入与错误处理机制。
- **参数/属性契约**:

| 名称  | 类型   | 可选  | 约束/默认值 | 语义说明                                                      |
| ----- | ------ | ----- | ----------- | ------------------------------------------------------------- |
| key   | string | true  | -           | 请求键名，用于设置 Redis 对象状态或缓存数据。                 |
| value | any    | false | {}          | 待设置的 Redis 对象内容，支持任意类型值（如字符串、数字等）。 |

- **返回值/实例方法**: `set`返回 Promise<void>，成功则执行写入逻辑；若 key 为 'default'则直接调用 resolve()。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `del`函数全限定名

```typescript
function del(key: string): Promise<void> {
  return new Promise((resolve) => {
    if (key === "default") resolve();
    else redisClient.del(key).then(resolve);
  });
}
```

- **设计意图**: 删除 Redis 对象状态，支持异步移除与错误处理机制。
- **参数/属性契约**:

| 名称        | 类型        | 可选  | 约束/默认值                       | 语义说明                                             |
| ----------- | ----------- | ----- | --------------------------------- | ---------------------------------------------------- |
| key         | string      | true  | -                                 | 请求键名，用于删除 Redis 对象状态或缓存数据。        |
| redisClient | RedisClient | false | { maxRetries: number, timeoutMs } | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |

- **返回值/实例方法**: `del`返回 Promise<void>，成功则执行删除逻辑；若 key 为 'default'则直接调用 resolve()。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `delMany`函数全限定名

```typescript
function delMany(keys: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (keys.length === 0 || keys.includes("default")) resolve();
    else redisClient.delMany(keys).then(resolve);
  });
}
```

- **设计意图**: 批量删除 Redis 对象状态，支持异步移除与错误处理机制。
- **参数/属性契约**:

| 名称        | 类型        | 可选  | 约束/默认值                       | 语义说明                                             |
| ----------- | ----------- | ----- | --------------------------------- | ---------------------------------------------------- |
| keys        | string[]    | true  | []                                | Redis 对象状态列表，支持批量删除操作。               |
| redisClient | RedisClient | false | { maxRetries: number, timeoutMs } | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |

- **返回值/实例方法**: `delMany`返回 Promise<void>，成功则执行删除逻辑；若 keys.length === 0 或包含 'default'则直接调用 resolve()。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `tryLock`函数全限定名

```typescript
function tryLock(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (key === "default") resolve(true);
    else redisClient.tryLock(key).then(resolve, reject);
  });
}
```

- **设计意图**: 尝试获取锁，支持异步等待与错误处理机制。
- **参数/属性契约**:

| 名称        | 类型        | 可选  | 约束/默认值                       | 语义说明                                             |
| ----------- | ----------- | ----- | --------------------------------- | ---------------------------------------------------- |
| key         | string      | true  | -                                 | Redis 对象状态键名，用于尝试获取锁或缓存数据。       |
| redisClient | RedisClient | false | { maxRetries: number, timeoutMs } | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |

- **返回值/实例方法**: `tryLock`返回 Promise<boolean>，成功则执行获取逻辑；若 key 为 'default'则直接调用 resolve()。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `releaseLock`函数全限定名

```typescript
function releaseLock(key: string): Promise<void> {
  return new Promise((resolve) => {
    if (key === "default") resolve();
    else redisClient.releaseLock(key).then(resolve);
  });
}
```

- **设计意图**: 释放 Redis 对象状态锁，支持异步关闭与错误处理机制。
- **参数/属性契约**:

| 名称        | 类型        | 可选  | 约束/默认值                       | 语义说明                                             |
| ----------- | ----------- | ----- | --------------------------------- | ---------------------------------------------------- |
| key         | string      | true  | -                                 | Redis 对象状态锁键名，用于释放锁或缓存数据。         |
| redisClient | RedisClient | false | { maxRetries: number, timeoutMs } | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |

- **返回值/实例方法**: `releaseLock`返回 Promise<void>，成功则执行释放逻辑；若 key 为 'default'则直接调用 resolve()。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `lock`函数全限定名

```typescript
function lock(key: string): Promise<void> {
  return new Promise((resolve) => {
    if (key === "default") resolve();
    else redisClient.lock(key).then(resolve);
  });
}
```

- **设计意图**: 获取 Redis 对象状态锁，支持异步等待与错误处理机制。
- **参数/属性契约**:

| 名称        | 类型        | 可选  | 约束/默认值                       | 语义说明                                             |
| ----------- | ----------- | ----- | --------------------------------- | ---------------------------------------------------- |
| key         | string      | true  | -                                 | Redis 对象状态锁键名，用于获取或释放锁。             |
| redisClient | RedisClient | false | { maxRetries: number, timeoutMs } | Redis 客户端实例化对象，负责连接管理、缓存及锁机制。 |

- **返回值/实例方法**: `lock`返回 Promise<void>，成功则执行获取逻辑；若 key 为 'default'则直接调用 resolve()。
- **使用约束**: [线程安全]：所有成员需保证在多线程环境下正确初始化与调用；[异常抛出]: 若 redisClient 连接失败将触发错误处理逻辑并记录日志。

#### `useLock`函数全限定名

```typescript
function useLock(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (key === "default") resolve(true);
    else redisClient.useLock(key).then(resolve, reject);
  });
}
```

- **设计意图**: 使用 Redis 对象状态锁，支持异步等待与错误处理机制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
| ---- | ---- | ---- | ----------- | -------- |
