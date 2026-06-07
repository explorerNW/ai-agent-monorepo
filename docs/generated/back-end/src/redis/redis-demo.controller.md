# RedisDemoController 技术文档

## 文件概述

`RedisDemoController.ts` 是一个 TypeScript 模块，用于演示如何在应用中使用 Redis。此模块包含多个函数和方法，每个函数都有其特定的功能。

### 类：RedisDemoController

- **描述**：这是一个控制器类，用于处理与 Redis 相关的操作。
- **参数**：无
- **业务意图**：提供一个框架来演示如何在应用中使用 Redis。

## 函数/方法

### constructor()

```typescript
constructor() {
  // 初始化代码
}
```

#### 参数解释：

- `无`：此函数没有参数。

#### 业务意图：

初始化控制器实例，为后续的处理操作做准备。

### basicCacheExample()

```typescript
basicCacheExample() {
  // 示例代码
}
```

#### 参数解释：

- `无`：此方法不接受任何参数。

#### 业务意图：

演示如何使用基本缓存功能来存储和检索数据。

### getOrSetExample()

```typescript
getOrSetExample(key: string, value: any) {
  // 示例代码
}
```

#### 参数解释：

- `key`: 字符串，表示要操作的键。
- `value`: 可以是任何类型的数据，用于存储或检索。

#### 业务意图：

演示如何使用 Redis 的 `get` 和 `set` 方法来获取和设置数据。

### distributedLockExample()

```typescript
distributedLockExample(lockName: string, callback: () => void) {
  // 示例代码
}
```

#### 参数解释：

- `lockName`: 字符串，表示要使用的分布式锁的名称。
- `callback`: 函数，用于处理锁操作的结果。

#### 业务意图：

演示如何使用 Redis 的分布式锁功能来确保并发安全。

### autoCacheExample()

```typescript
autoCacheExample(key: string, value: any) {
  // 示例代码
}
```

#### 参数解释：

- `key`: 字符串，表示要操作的键。
- `value`: 可以是任何类型的数据，用于存储或检索。

#### 业务意图：

演示如何使用 Redis 的自动缓存功能来存储和检索数据。

### invalidateCacheExample()

```typescript
invalidateCacheExample(key: string) {
  // 示例代码
}
```

#### 参数解释：

- `key`: 字符串，表示要操作的键。

#### 业务意图：

演示如何使用 Redis 的 `delete` 方法来删除缓存条目。

### batchDeleteExample()

```typescript
batchDeleteExample(keys: string[]) {
  // 示例代码
}
```

#### 参数解释：

- `keys`: 数组，包含要删除的所有键名。

#### 业务意图：

演示如何批量删除 Redis 中的多个键值对。

### bloomFilterCheck()

```typescript
bloomFilterCheck(key: string) {
  // 示例代码
}
```

#### 参数解释：

- `key`: 字符串，表示要检查的键。

#### 业务意图：

演示如何使用 Redis 的 Bloom Filter 来检查数据是否存在。

### bloomFilterAdd()

```typescript
bloomFilterAdd(key: string, value: any) {
  // 示例代码
}
```

#### 参数解释：

- `key`: 字符串，表示要添加到 Bloom Filter 的键。
- `value`: 可以是任何类型的数据，用于存储或检索。

#### 业务意图：

演示如何使用 Redis 的 Bloom Filter 来检查数据是否存在，并在必要时进行插入操作。

### manualLockExample()

```typescript
manualLockExample(lockName: string, callback: () => void) {
  // 示例代码
}
```

#### 参数解释：

- `lockName`: 字符串，表示要使用的分布式锁的名称。
- `callback`: 函数，用于处理锁操作的结果。

#### 业务意图：

演示如何使用 Redis 的手动锁功能来确保并发安全。

### blockingLockExample()

```typescript
blockingLockExample(lockName: string, callback: () => void) {
  // 示例代码
}
```

#### 参数解释：

- `lockName`: 字符串，表示要使用的分布式锁的名称。
- `callback`: 函数，用于处理锁操作的结果。

#### 业务意图：

演示如何使用 Redis 的阻塞锁功能来确保并发安全。

### cacheStats()

```typescript
cacheStats() {
  // 示例代码
}
```

#### 参数解释：

- `无`：此方法不接受任何参数。

#### 业务意图：

演示如何获取缓存的统计信息，如命中率、总访问次数等。

## 总结

`RedisDemoController.ts` 是一个用于演示 Redis 使用的 TypeScript 模块。它包含多个函数和方法，每个函数都有其特定的功能，通过这些功能可以展示在应用中使用 Redis 的不同方式。
