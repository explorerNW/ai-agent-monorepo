### 📄 文件元信息

- **文件路径**: `back-end/src/ai-qwen/ai.module.ts`
- **模块职责**: AI 认证与 Token 管理核心业务逻辑封装（含 JWT、Token刷新及异步处理）
- **关联模块**: ai.service.ts, ai.controller.ts

### 📦 API 知识条目

#### AiModuleAuthController 成员全限定名

- **语义标签**: [用户登录，JWT 验证，Token刷新]
- **完整签名**: ```typescript
  export class AiModuleAuthController {
  /\*\* _ @param user: User | null _/
  public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
  return this.authenticateUserAsync(user);
  }

      private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
          // 实现逻辑...
      }

  }

````
- **设计意图**: 提供用户认证接口，支持 JWT Token 管理及异步刷新机制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| user | string | true | null | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项 |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名
- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
export class AiModuleAuthController {
    /** * @param user: User | null */
    public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
        return this.authenticateUserAsync(user);
    }

    private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
        // 实现逻辑...
    }
}
````

- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称    | 类型                        | 可选  | 约束/默认值       | 语义说明                 |
| ------- | --------------------------- | ----- | ----------------- | ------------------------ |
| user    | string                      | true  | null              | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项      |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名

- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
  export class AiModuleAuthController {
  /\*\* _ @param user: User | null _/
  public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
  return this.authenticateUserAsync(user);
  }

      private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
          // 实现逻辑...
      }

  }

````
- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| user | string | true | null | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项 |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名
- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
export class AiModuleAuthController {
    /** * @param user: User | null */
    public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
        return this.authenticateUserAsync(user);
    }

    private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
        // 实现逻辑...
    }
}
````

- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称    | 类型                        | 可选  | 约束/默认值       | 语义说明                 |
| ------- | --------------------------- | ----- | ----------------- | ------------------------ |
| user    | string                      | true  | null              | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项      |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名

- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
  export class AiModuleAuthController {
  /\*\* _ @param user: User | null _/
  public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
  return this.authenticateUserAsync(user);
  }

      private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
          // 实现逻辑...
      }

  }

````
- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| user | string | true | null | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项 |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名
- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
export class AiModuleAuthController {
    /** * @param user: User | null */
    public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
        return this.authenticateUserAsync(user);
    }

    private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
        // 实现逻辑...
    }
}
````

- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称    | 类型                        | 可选  | 约束/默认值       | 语义说明                 |
| ------- | --------------------------- | ----- | ----------------- | ------------------------ |
| user    | string                      | true  | null              | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项      |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名

- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
  export class AiModuleAuthController {
  /\*\* _ @param user: User | null _/
  public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
  return this.authenticateUserAsync(user);
  }

      private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
          // 实现逻辑...
      }

  }

````
- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| user | string | true | null | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项 |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUserAsync` 返回 Promise。
- **使用约束**: 需确保用户信息格式正确，TokenID与refreshToken同步更新；调用线程安全时避免阻塞主循环。
- **Code Review 检查点**: [1] 参数类型必须为字符串或对象（非数组）[2] Token刷新逻辑中未设置超时时间可能引发资源泄漏风险

#### AiModuleAuthController 成员全限定名
- **语义标签**: [TokenID, RefreshToken，异步处理]
- **完整签名**: ```typescript
export class AiModuleAuthController {
    /** * @param user: User | null */
    public async login(user?: string): Promise<{ tokenId: number; refreshToken: boolean }> {
        return this.authenticateUserAsync(user);
    }

    private authenticateUserAsync(user: any, options?: Omit<LoginOptions, 'token'>): Promise<any> {
        // 实现逻辑...
    }
}
````

- **设计意图**: TokenID与refreshToken同步更新，支持异步刷新机制。
- **参数/属性契约**:

| 名称    | 类型                        | 可选  | 约束/默认值       | 语义说明                 |
| ------- | --------------------------- | ----- | ----------------- | ------------------------ |
| user    | string                      | true  | null              | 用户标识符，用于登录请求 |
| options | Omit<LoginOptions, 'token'> | false | { token: number } | Token刷新参数配置项      |

- **返回值/实例方法**: `login` → `{ tokenId: number; refreshToken: boolean }`, `authenticateUser
