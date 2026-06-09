# RedisService 类

## 文件概述

`RedisService.ts` 是一个 TypeScript 模块，用于与 Redis 数据库进行交互。它包含了一系列的函数和方法，这些功能允许我们执行诸如获取、设置、删除键值对以及锁定/解锁锁等操作。

## Class: RedisService

### 参数解释

- `host`: 服务器地址（默认为 "localhost"）
- `port`: 端口号（默认为 6379）
- `password`: 连接时需要的密码（如果使用）

### 业务意图推断

- 该类的主要目的是提供一个接口，用于与 Redis 数据库进行交互。通过这个类，我们可以方便地执行各种 Redis 操作。

## Function/Method: constructor

```typescript
constructor(host = 'localhost', port = 6379, password?: string) {
    this.host = host;
    this.port = port;
    this.password = password;
}
```

### 参数解释

- `host`: 服务器地址（默认为 "localhost"）
- `port`: 端口号（默认为 6379）
- `password`: 连接时需要的密码（如果使用）

### 业务意图推断

- 构造函数用于初始化 RedisService 对象，设置连接参数。

## Function/Method: get

```typescript
get(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const request = `GET ${key}`;
        this.client.get(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
```

### 参数解释

- `key`: 要获取的键

### 业务意图推断

- 这个方法用于从 Redis 中获取指定键的数据。

## Function/Method: set

```typescript
set(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = `SET ${key} ${value}`;
        this.client.set(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
```

### 参数解释

- `key`: 要设置的键
- `value`: 要存储在键中的值

### 业务意图推断

- 这个方法用于将指定的键和值对存储到 Redis 中。

## Function/Method: del

```typescript
del(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = `DEL ${key}`;
        this.client.del(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
```

### 参数解释

- `key`: 要删除的键

### 业务意图推断

- 这个方法用于从 Redis 中删除指定的键。

## Function/Method: delMany

```typescript
delMany(keys: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = `DEL ${keys.join(' ')}`;
        this.client.del(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
```

### 参数解释

- `keys`: 要删除的多个键

### 业务意图推断

- 这个方法用于从 Redis 中批量删除指定的多个键。

## Function/Method: tryLock

```typescript
tryLock(key: string, timeout?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const request = `TRYLOCK ${key}`;
        this.client.set(request, '1', (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result === '1' ? null : key);
            }
        });
    });
}
```

### 参数解释

- `key`: 要尝试锁定的键
- `timeout?: number`: 锁定超时时间（默认为 0，表示立即锁定）

### 业务意图推断

- 这个方法用于尝试在 Redis 中锁定指定的键。

## Function/Method: releaseLock

```typescript
releaseLock(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = `RELEASELOCK ${key}`;
        this.client.set(request, '1', (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
```

### 参数解释

- `key`: 要释放锁的键

### 业务意图推断

- 这个方法用于在 Redis 中释放锁定指定的键。

## Function/Method: lock

```typescript
lock(key: string, timeout?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const request = `LOCK ${key}`;
        this.client.set(request, '1', (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result === '1' ? null : key);
            }
        });
    });
}
```

### 参数解释

- `key`: 要锁定的键
- `timeout?: number`: 锁定超时时间（默认为 0，表示立即锁定）

### 业务意图推断

- 这个方法用于在 Redis 中锁定指定的键。

## Function/Method: useLock

```typescript
useLock(key: string, timeout?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const request = `USELOCK ${key}`;
        this.client.set(request, '1', (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result === '1' ? null : key);
            }
        });
    });
}
```

### 参数解释

- `key`: 要使用的锁的键
- `timeout?: number`: 锁定超时时间（默认为 0，表示立即锁定）

### 业务意图推断

- 这个方法用于在 Redis 中使用指定的锁。

## Function/Method: getOrSet

```typescript
getOrSet(key: string, value: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const request = `GET ${key} || SET ${key} ${value}`;
        this.client.get(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
```

### 参数解释

- `key`: 要获取或设置的键
- `value`: 要存储在键中的值

### 业务意图推断

- 这个方法用于从 Redis 中获取指定键的数据，并将数据存入该键。

## Function/Method: bloomExists

```typescript
bloomExists(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const request = `BLOOM EXISTS ${key}`;
        this.client.get(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result === '1');
            }
        });
    });
}
```

### 参数解释

- `key`: 要检查的键

### 业务意图推断

- 这个方法用于在 Redis 中检查指定的键是否存在。

## Function/Method: bloomAdd

```typescript
bloomAdd(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = `BLOOM ADD ${key} ${value}`;
        this.client.set(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
```

### 参数解释

- `key`: 要添加到的键
- `value`: 要存储在键中的值

### 业务意图推断

- 这个方法用于将指定的键和值对添加到 Redis 中。

## Function/Method: generateLockId

```typescript
generateLockId(): Promise<string> {
    return new Promise((resolve, reject) => {
        const request = `GENLOCK`;
        this.client.get(request, (err, result) => {
            if (err || !result) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
```

### 参数解释

- 无

### 业务意图推断

- 这个方法用于生成一个锁定标识符。
