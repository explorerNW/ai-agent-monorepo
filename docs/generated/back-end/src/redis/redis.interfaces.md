### 📄 文件元信息

- **文件路径**: `back-end/src/redis/redis.interfaces.ts`
- **模块职责**: Redis 配置与缓存管理接口定义（含连接池、锁机制及超时策略）
- **关联模块**: [未提供]

---

## 📦 API 知识条目

### 🔹 RedisConfig

#### RedisConfig成员全限定名

```typescript
interface RedisConfig {
  redis: string; // 默认值：'redis://localhost:6379/0';
}
```

- **语义标签**: [连接配置, Redis服务地址，超时时间]
- **完整签名**: ```typescript
  export interface RedisConfig {
  redis?: string | null = 'redis://localhost:6379/0'; // 可选：Redis服务地址或默认值；
  }

````
- **设计意图**: [定义连接配置项用于初始化 Redis 客户端，确保服务可访问性]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| redis | string | true | 'redis://localhost:6379/0' | Redis服务地址配置项，支持自定义连接字符串或默认端口设置 |

- **返回值/实例方法**: [无]
- **使用约束**: 需确保 `redis` 字段为必填参数；调用时建议校验是否已初始化客户端。
- **Code Review 检查点**:
1. Redis服务地址配置项必须明确指定连接字符串或默认值，避免硬编码错误路径
2. 若未设置 `redis` 属性，应验证是否存在有效的 Redis 连接池配置

### 🔹 LockOptions
#### LockOptions成员全限定名
```typescript
interface LockOptions {
    lock: string; // 锁类型：'thread', 'queue';
}
````

- **语义标签**: [线程安全, 队列阻塞]
- **完整签名**: ```typescript
  export interface LockOptions {
  lock?: string = 'thread'; // 可选：lock类型为'string'或'default值；
  }

````
- **设计意图**: [定义锁类型配置项，用于控制并发访问的线程安全机制]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| lock | string | true | 'thread'或'default值；'queue'; // 锁类型为'string'或'default值；'queue'; | 线程安全配置项，支持自定义锁类型如'result', 'lock'; |

- **返回值/实例方法**: [无]
- **使用约束**:
1. `lock`字段必须为必填参数
2. 若未设置该属性，应验证是否存在有效的锁类型配置

### 🔹 CacheOptions
#### CacheOptions成员全限定名
```typescript
interface CacheOptions {
    ttl: number; // 缓存过期时间：毫秒；
}
````

- **语义标签**: [缓存策略, TTL]
- **完整签名**: ```typescript
  export interface CacheOptions {
  ttl?: number = 3600; // 可选：ttl为'number';或'default值；'ms'; // 默认值为毫秒数  
  }

````
- **设计意图**: [定义缓存策略配置项，用于控制数据持久化与过期时间]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| ttl | number | true | '3600'或'default值；'ms'; // 缓存过期时间配置项，支持自定义毫秒数设置 | TTL为数字类型，默认为1小时（3600秒）的默认超时策略

- **返回值/实例方法**: [无]
- **使用约束**:
1. `ttl`字段必须为必填参数
2. 若未设置该属性，应验证是否存在有效的缓存过期时间配置

### 🔹 CacheInterceptorOptions
#### CacheInterceptorOptions成员全限定名
```typescript
interface CacheInterceptorOptions {
    cache: string; // 缓存策略：'memory', 'redis';
}
````

- **语义标签**: [内存缓存, Redis缓存]
- **完整签名**: ```typescript
  export interface CacheInterceptorOptions {
  cache?: string = 'memory'; // 可选：cache类型为'string'或'default值；'ms'; // 默认值为毫秒数  
  }

````
- **设计意图**: [定义缓存拦截器配置项，用于控制数据持久化与过期时间]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| cache | string | true | 'memory'或'default值；'ms'; // 缓存策略配置项，支持自定义毫秒数设置 | Cache拦截器配置项，默认为内存缓存（3600秒）

- **返回值/实例方法**: [无]
- **使用约束**:
1. `cache`字段必须为必填参数
2. 若未设置该属性，应验证是否存在有效的缓存策略配置

### 🔹 BloomFilterOptions
#### BloomFilterOptions成员全限定名
```typescript
interface BloomFilterOptions {
    size: number; // 大小：毫秒；
}
````

- **语义标签**: [Bloom过滤器, 内存]
- **完整签名**: ```typescript
  export interface BloomFilterOptions {
  bloom?: boolean = true; // 可选：bloom类型为'boolean';或'default值；'ms'; // 默认值为布尔类型  
  }

```
- **设计意图**: [定义Bloom过滤器配置项，用于快速查询与内存缓存]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| bloom | boolean | true | 'true'或'default值；'ms'; // Bloom过滤器配置项，默认为布尔类型
}
```

- **返回值/实例方法**: [无]
- **使用约束**:

1. `bloom`字段必须为必填参数
2. 若未设置该属性，应验证是否存在有效的Bloom过滤器配置

---

### 📋 Code Review Checklist（基于上述API）

| API                | 审查重点                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| RedisConfig        | 是否已正确初始化Redis连接池？<br>• 检查`redis`字段是否为必填参数<br>• 验证默认值是否正确配置   |
| LockOptions        | 锁类型选择是否符合业务需求？<br>• 确认线程安全策略（如'result'或'default值；queue';）是否合理  |
| CacheOptions       | TTL设置是否与缓存性能要求匹配？<br>• 检查`ttl`是否为必填参数<br>• 验证默认超时时间配置是否正确 |
| BloomFilterOptions | 内存容量是否符合业务场景需求？<br>• 确认bloom类型（'boolean'或'default值；ms';）是否合理设置   |
