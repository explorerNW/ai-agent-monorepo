# RedisService 类结构化技术文档

## 文件概述

`RedisService.ts` 是一个 TypeScript 模块，包含用于与 Redis 数据库交互的类。此模块提供了一系列方法来执行常见的 Redis 操作，如获取、设置和删除键值对。

## 1. 构造函数 (constructor)

```typescript
constructor();
```

- **参数说明**：无。
- **业务意图**：初始化 `RedisService` 类实例，为后续操作做准备。

## 2. 获取 (get) 方法

```typescript
get(key: string): Promise<string | null>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
- **业务意图**：从 Redis 中获取指定键的值。如果键不存在，则返回 `null`。

## 3. 设置 (set) 方法

```typescript
set(key: string, value: string): Promise<void>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
  - `value`: 要存储的值（字符串类型）。
- **业务意图**：将指定键的值设置为给定的值。如果键已存在，则更新其值。

## 4. 删除 (del) 方法

```typescript
del(key: string): Promise<void>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
- **业务意图**：从 Redis 中删除指定的键。如果键不存在，则不执行任何操作。

## 5. 删除多个 (delMany) 方法

```typescript
delMany(keys: string[]): Promise<void>
```

- **参数说明**：
  - `keys`: 包含要删除的 Redis 键名（字符串数组）。
- **业务意图**：从 Redis 中删除指定的多个键。如果任何一个键不存在，则不执行任何操作。

## 6. 尝试锁定 (tryLock) 方法

```typescript
tryLock(key: string, timeout?: number): Promise<boolean>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
  - `timeout?`: 可选，锁定尝试的最大时间（毫秒）。
- **业务意图**：尝试在指定的键上获取一个锁。如果成功获取，则返回 `true`；否则，返回 `false`。

## 7. 释放锁定 (releaseLock) 方法

```typescript
releaseLock(key: string): Promise<void>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
- **业务意图**：从指定的键上释放锁。如果键不存在，则不执行任何操作。

## 8. 锁定 (lock) 方法

```typescript
lock(key: string, timeout?: number): Promise<void>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
  - `timeout?`: 可选，锁定尝试的最大时间（毫秒）。
- **业务意图**：在指定的键上尝试获取一个锁。如果成功获取，则返回 `true`；否则，返回 `false`。

## 9. 使用锁定 (useLock) 方法

```typescript
useLock(key: string, timeout?: number): Promise<void>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
  - `timeout?`: 可选，锁定尝试的最大时间（毫秒）。
- **业务意图**：在指定的键上使用锁。如果键不存在，则不执行任何操作。

## 10. 获取或设置 (getOrSet) 方法

```typescript
getOrSet(key: string, value?: string): Promise<string | null>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
  - `value?`: 可选，要存储的值（字符串类型）。
- **业务意图**：从 Redis 中获取指定键的值。如果键不存在，则将给定的值设置为该键，并返回其值。

## 11. 检查 Bloom 是否存在 (bloomExists) 方法

```typescript
bloomExists(key: string): Promise<boolean>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
- **业务意图**：检查指定的键在 Redis 中是否已存在。

## 12. 添加 Bloom 到集合 (bloomAdd) 方法

```typescript
bloomAdd(key: string, value?: string): Promise<void>
```

- **参数说明**：
  - `key`: Redis 键名（字符串类型）。
  - `value?`: 可选，要添加到集合的值（字符串类型）。
- **业务意图**：将指定的键或值添加到 Redis 中的 Bloom 集合。如果给定的是一个值，则将其存储在集合中。

## 13. 生成锁 ID (generateLockId) 方法

```typescript
generateLockId(): string | null
```

- **业务意图**：生成一个用于锁定的唯一 ID，返回 `null` 表示没有生成。
