### 📄 文件元信息

- **文件路径**: `front-end/app/store/index.ts`
- **模块职责**: Redux Store + AppDispatch 状态管理与异步操作管理（用户认证、Token刷新等）
- **关联模块**: `app/store/`, `store/user.js`, `utils/auth.js`

### 📦 API 知识条目

#### RootState 成员全限定名

- **语义标签**: [数据持久化, 权限控制, Token状态管理]
- **完整签名**: ```typescript
  interface RootState {
  user: User;
  token?: Token;
  }

````
- **设计意图**: 存储用户和认证状态的根状态对象，支持跨组件共享。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| user | User | - | `null` | 用户实例（含 ID、权限） |
| token | Token | - | undefined | JWT Token对象，支持刷新逻辑 |

- **返回值/实例方法**:
```typescript
export const rootState: RootState = { ... }; // 默认初始化状态
````

- **使用约束**: 线程安全（Redux Store），无特殊异常抛出。
- **Code Review 检查点**:

1. `user` 字段是否包含必要权限信息？
2. Token刷新逻辑是否正确处理异步请求？

#### AppDispatch 成员全限定名

- **语义标签**: [用户登录, Token刷新，响应处理]
- **完整签名**: ```typescript
  export const dispatch: (actionType: string) => void; // 支持异步操作回调

````
- **设计意图**: 封装异步调用逻辑（如用户认证、Token刷新），提升代码可读性。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| actionType | string | - | `string` | Action ID，如 `'login'`, `'refreshToken'` |

- **返回值/实例方法**:
```typescript
export const dispatch: (action) => void; // 异步处理回调函数
````

- **使用约束**: 线程安全（Redux Store），无特殊异常抛出。
- **Code Review 检查点**:

1. `dispatch` 是否支持错误捕获？
2. Action类型定义是否符合预期业务逻辑？

### 📥 输入代码结构说明

提供的两个 Export成员均包含完整签名，符合 TypeScript 架构规范：RootState 为状态对象接口，AppDispatch 为异步操作函数类。所有字段标注了语义标签、设计意图及 Code Review 检查点，确保文档可被 AI 检索和自动解析。
