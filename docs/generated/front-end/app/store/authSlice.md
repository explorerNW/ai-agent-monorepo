## 📄 文件元信息

- **文件路径**: `front-end/app/store/authSlice.ts`
- **模块职责**: 管理用户身份验证、Token 生命周期及认证状态同步逻辑
- **关联模块**: authStore, userService

---

### 📦 API 知识条目

#### UserInfo 成员全限定名

- **语义标签**: `user`, `authentication`, `token`
- **完整签名**: ```typescript
  interface UserInfo {
  id: string; // 用户唯一标识符
  username: string; // 用户名（可选）
  email?: string; // 邮箱地址（必填，用于验证）
  avatarUrl?: string; // 头像链接（可选）
  }

````
- **设计意图**: 存储用户在系统中的基础身份信息及关联的认证凭证。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| id | string | ✅ | `null` | 用户唯一标识符，用于系统内关联查询。 |
| username | string | ❌ | - | 用户名（必填），作为身份识别的唯一凭证。 |
| email | string | ❌ | - | 邮箱地址（可选），支持多格式验证。 |
| avatarUrl | string | ✅ | `null` | 头像链接，用于用户展示或登录场景。 |

- **返回值/实例方法**:
```typescript
// UserInfo 接口本身无直接返回值，但可通过属性访问数据
userInfo: UserInfo; // 获取当前用户的完整信息对象
````

- **使用约束**:
  - `id` 字段必须存在且唯一（避免重复标识）。
  - `username/email/avatarUrl` 为必填项或可选依赖。
  - 调用时需校验是否存在未授权访问的权限链。

#### AuthState 成员全限定名

- **语义标签**: `authentication`, `token`, `state`
- **完整签名**: ```typescript
  interface AuthState {
  token: string; // JWT Token（必填）
  user?: UserInfo | null; // 当前用户对象，可选。若为 null 表示未登录状态。
  }

````
- **设计意图**: 存储认证上下文信息，用于后续请求的权限校验与会话管理。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| token | string | ✅ | `null` | JWT Token（必填），用于身份验证与权限控制。 |
| user | UserInfo | ❌ | - | 当前用户对象，若为 null 表示未登录状态或无认证信息。 |

- **返回值/实例方法**:
```typescript
// AuthState 接口本身无直接返回值，但可通过属性访问数据
auth: AuthState; // 获取当前认证的完整上下文对象
````

- **使用约束**:
  - `token` 必须存在且有效（防止未授权请求）。
  - `user` 字段需校验是否存在或是否为空。

---

### 📥 Code Review Checkpoints for Each API Member

#### UserInfo 成员全限定名

1. ✅ 是否包含所有必需属性？（如邮箱、头像）
2. ❌ 是否有未授权访问的权限链检查逻辑缺失？
3. ⚠️ `username` 是否为必填项或默认值明确定义？

**审查建议**:

- 确保用户信息字段与系统认证策略一致。
- 验证调用方是否已正确传递必要参数（如 Token、用户名）。
- 确认是否存在未授权访问的权限链检查逻辑缺失问题。

#### AuthState 成员全限定名

1. ✅ `token` 是否为必填项或默认值明确定义？
2. ❌ 是否有未授权访问的权限链检查逻辑缺失？
3. ⚠️ `user` 字段是否校验是否存在或未登录状态正确标识？

**审查建议**:

- Token 必须存在且有效，防止未授权请求。
- 确保用户信息对象与系统认证策略一致（如是否为 null）。
- 验证调用方是否正确传递必要参数或权限链检查逻辑缺失问题。
