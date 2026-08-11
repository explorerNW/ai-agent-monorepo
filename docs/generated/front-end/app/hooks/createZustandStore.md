### 📄 文件元信息

- **文件路径**: `front-end/app/hooks/createZustandStore.ts`
- **模块职责**: TypeScript Zustand Store Hook 管理用户状态与异步请求处理逻辑
- **关联模块**: `createZustandStore`, `useAuthContext`, `asyncRequestHandler`

### 📦 API 知识条目

#### createCustomStore 成员全限定名

- **语义标签**: [User Authentication, JWT Token Refresh, Async Request Handling]
- **完整签名**: ```typescript
  export function createCustomStore(initialState: { ... } = {}): Store;

````
- **设计意图**: 提供 Zustand Store Hook，用于管理用户状态与异步请求处理逻辑。解决复杂业务场景下的数据持久化问题。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| initialState | { ... } | - | {} | Store 初始状态配置，包含用户、Token等关键数据。 |
| storeId | string | - | 'default' | Store ID，用于区分不同状态的持久化存储。 |

- **返回值/实例方法**: `Store` (类型：State) + [handleAsyncRequest] (函数)。支持异步请求处理与状态管理。
- **使用约束**: 线程安全（无特殊），调用顺序需遵循 Zustand API 规范。异常抛出时捕获并记录日志，确保数据一致性。

#### useAuthContext 成员全限定名
- **语义标签**: [User Authentication, JWT Token Refresh]
- **完整签名**: ```typescript
export function useAuthContext(): { user: User | null; token?: string } & { refreshToken() };
````

- **设计意图**: 提供用户上下文管理，支持动态刷新 Token。解决复杂业务场景下的状态同步问题。
- **参数/属性契约**:

| 名称  | 类型   | 可选 | 约束/默认值 | 语义说明                                     |
| ----- | ------ | ---- | ----------- | -------------------------------------------- |
| user  | User   | -    | null        | 当前用户对象，包含身份信息、权限等关键数据。 |
| token | string | -    | undefined   | Token ID，用于标识当前会话的访问权。         |

- **返回值/实例方法**: `User` (类型：State) + [refreshToken] (函数)。支持动态刷新 Token 并更新上下文状态。
- **使用约束**: 线程安全（无特殊），调用顺序需遵循 Zustand API 规范，确保数据一致性。异常抛出时捕获并记录日志，确保业务逻辑正确性。

#### asyncRequestHandler 成员全限定名

- **语义标签**: [Async Request Handling, Token Refresh]
- **完整签名**: ```typescript
  export function asyncRequestHandler(request: { ... } = {}): Promise<{ status: 'success' | 'error'; data?: any }>;

```
- **设计意图**: 提供异步请求处理机制，支持复杂业务场景下的状态同步。解决多步骤数据流转问题。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| request | { ... } | - | {} | Request ID，用于标识当前请求的上下文信息。 |
| response | any | - | undefined | Response 对象，包含处理结果及状态码。 |

- **返回值/实例方法**: `Promise<{ status: 'success' | 'error'; data?: any }>`.支持异步请求处理与响应管理。
- **使用约束**: 线程安全（无特殊），调用顺序需遵循 Zustand API 规范，确保数据一致性。异常抛出时捕获并记录日志，确保业务逻辑正确性。
```
