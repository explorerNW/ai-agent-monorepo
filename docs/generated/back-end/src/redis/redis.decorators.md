### 📄 文件元信息

- **文件路径**: `back-end/src/redis/redis.decorators.ts`
- **模块职责**: Redis 缓存与锁机制管理工具集（支持异步、并发控制）
- **关联模块**: `src/utils/cache-manager`, `src/services/rate-limiting`, `src/configs/database-cache`

### 📦 API 知识条目

#### UseRedisCache成员全限定名

- **语义标签**: Redis缓存, Token管理，原子操作，异步处理
- **完整签名**: ```typescript
  export function useRedisCache<T>(key: string): Promise<Set<T>>;

````
- **设计意图**: 提供高性能的 Redis 缓存支持，确保数据持久化与并发控制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| key | string | true | `""` | Redis Key（缓存键） |
| ttl | number | false | `0` | TTL 时间限制，单位秒 |

- **返回值/实例方法**:
```typescript
Promise<Set<T>>; // 返回所有已存在的值集合
````

- **使用约束**: 支持异步处理、线程安全（Redis Lock）；调用顺序需保证数据一致性。
- **Code Review 检查点**:

1. Key 是否包含过期时间限制？
2. TTL 设置是否符合业务需求？
3. Redis 锁机制是否正确配置？

#### InvalidateCache成员全限定名

- **语义标签**: Cache invalidation, Token刷新，异步处理，原子操作
- **完整签名**: ```typescript
  export function invalidateCache(key: string): void;

````
- **设计意图**: 清理缓存数据或触发定时任务。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| key | string | true | `""` | Redis Key（需明确缓存键） |

- **返回值/实例方法**:
```typescript
void; // 无返回类型，仅执行操作
````

- **使用约束**: 支持异步处理、线程安全；调用顺序需保证数据一致性。
- **Code Review 检查点**:

1. Key 是否包含过期时间限制？
2. TTL 设置是否符合业务需求？
3. Redis 锁机制是否正确配置？

#### UseRedisLock成员全限定名

- **语义标签**: Token管理，原子操作，异步处理，并发控制
- **完整签名**: ```typescript
  export function useRedisLock<T>(key: string): Promise<Set<T>>;

````
- **设计意图**: 提供 Redis 锁机制支持，确保数据独占访问。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| key | string | true | `""` | Redis Key（缓存键） |

- **返回值/实例方法**:
```typescript
Promise<Set<T>>; // 返回所有已存在的值集合
````

- **使用约束**: 支持异步处理、线程安全；调用顺序需保证数据一致性。
- **Code Review 检查点**:

1. Key 是否包含过期时间限制？
2. TTL 设置是否符合业务需求？
3. Redis 锁机制是否正确配置？
