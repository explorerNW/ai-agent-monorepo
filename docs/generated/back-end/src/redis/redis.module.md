### 📄 文件元信息

- **文件路径**: `back-end/src/redis/redis.module.ts`
- **模块职责**: Redis 连接管理、缓存配置与数据持久化服务（核心业务领域：Redis 客户端操作）
- **关联模块**: redis-client, cache-manager

### 📦 API 知识条目

#### RedisClientConnectionManager成员全限定名

- **语义标签**: `redis connection`, `connection pool management`, `cache configuration`
- **完整签名**: ```typescript
  interface RedisClientConnectionManager {
  getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
  setCacheKey(key: string, ttlMs: number): void;
  expireKeys(keys: Array<string>): void;
  clearAllCache(): void;
  }

````
- **设计意图**: 管理 Redis 连接池，支持缓存配置与持久化操作。解决多实例并发访问下的数据一致性保障问题。
- **参数/属性契约**

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| `getRedisInfo()` | Promise<{ redis: string; host?: string }> | null | - | 获取 Redis 连接信息，用于诊断或配置管理。 |
| `setCacheKey(key, ttlMs)` | void | true | { key: string } = 'key' | 设置缓存键的 TTL（时间过期），支持动态更新缓存策略。 |
| `expireKeys(keys)` | void | false | - | 批量删除指定 Redis 键，适用于快速清理旧数据。 |

- **返回值/实例方法**:
  ```typescript
  { redis: string; host?: string } // Promise<...>
````

- **使用约束**:
  - `getRedisInfo()`：需确保连接状态正常（无超时、异常）。
  - `setCacheKey` / `expireKeys`: 调用前验证键是否存在，避免重复操作。

#### RedisClientConnectionManager成员全限定名

- **语义标签**: `redis connection`, `connection pool management`, `cache configuration`
- **完整签名**: ```typescript
  interface RedisClientConnectionManager {
  getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
  setCacheKey(key: string, ttlMs: number): void;
  expireKeys(keys: Array<string>): void;
  clearAllCache(): void;
  }

````
- **设计意图**: 管理 Redis 连接池，支持缓存配置与持久化操作。解决多实例并发访问下的数据一致性保障问题。

#### CacheManager成员全限定名
- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
    interface CacheManager {
        getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

- **设计意图**: 管理缓存配置，支持 TTL（时间过期）策略与批量删除操作。解决多实例并发访问下的数据一致性保障问题。

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
        clearAllCache(): void;
    }
````

#### CacheManager成员全限定名

- **语义标签**: `cache configuration`, `ttl management`
- **完整签名**: ```typescript
  interface CacheManager {
  getCacheInfo(): Promise<{ cache: string; ttlMs?: number }> | null;
  setCacheKey(key, ttlMs): void;
  expireKeys(keys): void;
  clearAllCache(): void;
  }

````

#### RedisClientConnectionManager成员全限定名
- **语义标签**: `redis connection`, `connection pool management`
- **完整签名**: ```typescript
    interface RedisClientConnectionManager {
        getRedisInfo(): Promise<{ redis: string; host?: string }> | null;
        setCacheKey(key, ttlMs): void;
        expireKeys(keys): void;
````
