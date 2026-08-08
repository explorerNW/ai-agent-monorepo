# `authSlice.ts` 技术文档

## 📄 文件概述

`authSlice.ts` 是一个典型的基于 **Redux Toolkit (RTK)** 的状态管理切片文件，专注于处理应用中的**用户认证与授权（Authentication & Authorization）**领域。  
从提取的结构来看，该文件目前主要定义了认证模块的核心数据契约（Data Contracts），包括用户信息模型与认证状态模型。作为架构层的基础设施，该文件负责：

- 统一认证相关数据的类型定义，确保跨组件/模块的类型安全。
- 为 Redux Store 提供状态结构规范，支撑登录、登出、Token 刷新、权限校验等核心业务流。
- 为后续的 `createSlice`、异步 Thunk 及选择器（Selectors）提供类型约束基础。

> 📌 **注**：当前提取数据仅包含接口定义。以下文档基于企业级前端架构惯例与 `authSlice.ts` 命名规范，对缺失的属性、函数及业务意图进行合理推断，并标注为 `[推断]`。

---

## 🧱 核心数据结构定义

### 1. `UserInfo` 接口 (Line 4)

#### 📖 说明

定义当前已认证用户的个人信息模型。通常由后端 `/api/auth/me` 或登录接口返回，并在前端进行标准化处理。

#### 🔍 属性说明 `[推断]`

| 属性名      | 类型               | 说明                                                         |
| ----------- | ------------------ | ------------------------------------------------------------ |
| `id`        | `string \| number` | 用户唯一标识，用于路由守卫、权限校验及 API 请求头注入        |
| `username`  | `string`           | 登录名/昵称，用于 UI 展示（如头像下拉菜单）                  |
| `email`     | `string`           | 用户邮箱，用于账号绑定、密码重置及通知                       |
| `avatar`    | `string \| null`   | 头像 URL，支持懒加载与降级占位图                             |
| `roles`     | `string[]`         | 角色标识数组（如 `['admin', 'editor']`），用于 RBAC 权限控制 |
| `createdAt` | `string`           | 账号创建时间（ISO 8601），用于审计与展示                     |

#### 💼 业务意图推断

- **数据契约标准化**：避免各业务模块自行定义用户字段，降低维护成本。
- **权限驱动 UI**：通过 `roles` 字段实现组件级权限渲染（如 `<RequireRole roles={['admin']}>`）。
- **会话持久化**：通常与 `localStorage`/`sessionStorage` 或 `IndexedDB` 配合，实现免登体验。

---

### 2. `AuthState` 接口 (Line 10)

#### 📖 说明

定义认证模块在 Redux Store 中的状态结构。作为 `authSlice` 的 `initialState` 类型约束，承载认证生命周期所需的所有运行时数据。

#### 🔍 属性说明 `[推断]`

| 属性名            | 类型               | 说明                                                           |
| ----------------- | ------------------ | -------------------------------------------------------------- |
| `user`            | `UserInfo \| null` | 当前登录用户信息，未登录时为 `null`                            |
| `token`           | `string \| null`   | 访问令牌（JWT/Session Token），用于 HTTP 拦截器注入            |
| `refreshToken`    | `string \| null`   | 刷新令牌，用于无感续期（Silent Refresh）                       |
| `isLoading`       | `boolean`          | 认证操作进行中状态（登录/注册/刷新 Token）                     |
| `error`           | `string \| null`   | 认证失败原因，用于全局 Toast 或表单错误提示                    |
| `isAuthenticated` | `boolean`          | 派生状态，标识当前会话是否有效（通常由 `token !== null` 推导） |

#### 💼 业务意图推断

- **状态机管理**：通过 `isLoading` 与 `error` 实现认证操作的完整状态机（Idle → Loading → Success/Error）。
- **安全隔离**：Token 类字段通常不直接暴露给业务组件，仅通过 `createAsyncThunk` 与 `axios` 拦截器交互。
- **派生状态优化**：`isAuthenticated` 可作为 `createSelector` 的缓存计算字段，避免重复判断逻辑。

---

## 🏗️ 架构推断与设计建议

### 🔹 典型切片结构推断

基于上述接口，`authSlice.ts` 完整结构通常包含：

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 1. 异步操作（登录/登出/刷新）
export const login = createAsyncThunk('auth/login', async (credentials: {...}) => { ... });
export const logout = createAsyncThunk('auth/logout', async () => { ... });

// 2. 切片定义
const authSlice = createSlice({
  name: 'auth',
  initialState: { /* 符合 AuthState */ },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser: (state, action: PayloadAction<UserInfo>) => { state.user = action.payload; }
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => { state.isLoading = true; state.error = null; });
    builder.addCase(login.fulfilled, (state, action) => { /* 更新 token & user */ });
    // ...
  }
});
```

### 🔹 架构最佳实践建议

1. **类型安全优先**：使用 `Omit`/`Pick` 或 Zod/Yup 对后端响应进行运行时校验，避免脏数据污染 `UserInfo`。
2. **Token 安全策略**：
   - 敏感字段（`token`, `refreshToken`）建议标记为 `@ts-expect-error` 或使用 `SensitiveString` 类型包装，防止日志泄露。
   - 结合 `httpOnly` Cookie 或内存存储（配合 `beforeunload` 清理）提升 XSS 防护。
3. **状态派生优化**：`isAuthenticated` 不应直接写入 state，推荐使用 `createSelector`：
   ```typescript
   export const selectIsAuthenticated = createSelector(
     (state: RootState) => state.auth.token,
     (token) => !!token,
   );
   ```
4. **扩展性设计**：若后续支持多租户或 SSO，建议在 `AuthState` 中预留 `tenantId` 或 `ssoProvider` 字段，避免破坏性重构。

---

## 📌 备注

- 本文档基于提取的接口元数据与 Redux Toolkit 生态规范生成，实际字段需以完整源码为准。
- 若需补充 `createSlice`、`thunk` 或 `selectors` 的详细文档，请提供完整代码结构或函数签名。
- 推荐配合 `@reduxjs/toolkit` 官方模板与 `eslint-plugin-redux` 进行类型与规范校验。
