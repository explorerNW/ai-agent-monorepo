# Redis 配置

## 文件概述

`redis.interfaces.ts` 文件是用于配置 Redis 实例的 TypeScript 类。它包含以下类和接口：

### `RedisConfig`

- **描述**：提供 Redis 配置选项。
- **参数**：
  - `host`: Redis 主机地址（默认为 "localhost"）。
  - `port`: Redis 端口号（默认为 6379）。
  - `password`: Redis 密码（如果需要认证）。

### `LockOptions`

- **描述**：提供用于锁操作的配置选项。
- **参数**：
  - `timeout`: 锁超时时间（单位：秒，如果为负值则表示无限期）。
  - `retry`: 锁重试次数（默认为 3 次）。

### `CacheOptions`

- **描述**：提供缓存配置选项。
- **参数**：
  - `ttl`: 缓存过期时间（单位：秒，如果为负值则表示无限期）。
  - `maxAge`: 最大缓存年龄（单位：秒）。

### `CacheInterceptorOptions`

- **描述**：提供缓存拦截器配置选项。
- **参数**：
  - `ttl`: 缓存过期时间（单位：秒，如果为负值则表示无限期）。
  - `maxAge`: 最大缓存年龄（单位：秒）。

### `BloomFilterOptions`

- **描述**：提供 Bloom Filter 配置选项。
- **参数**：
  - `size`: Bloom Filter 的大小（即存储的位数，如果为负值则表示无限大）。
  - `falsePositiveRate`: 假阳性率（如果为负值则表示无限小）。

## 示例

```typescript
// Redis 配置示例
const redisConfig: RedisConfig = {
  host: "127.0.0.1",
  port: 6379,
  password: "",
};

// Lock 操作配置示例
const lockOptions: LockOptions = {
  timeout: -1, // 无限期
  retry: 3,
};

// 缓存配置示例
const cacheOptions: CacheOptions = {
  ttl: -1, // 无限期
  maxAge: 60 * 60 * 24, // 一天
};

// 缓存拦截器配置示例
const cacheInterceptorOptions: CacheInterceptorOptions = {
  ttl: -1, // 无限期
  maxAge: 60 * 60, // 一小时
};

// Bloom Filter 配置示例
const bloomFilterOptions: BloomFilterOptions = {
  size: -1, // 无限大
  falsePositiveRate: 0.01, // 假阳性率
};
```

### 总结

`redis.interfaces.ts` 文件中的类和接口提供了对 Redis 实例的配置选项，包括锁操作、缓存配置和拦截器配置。这些配置选项可以根据实际需求进行调整，以满足不同的应用场景。
