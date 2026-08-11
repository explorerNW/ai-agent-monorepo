### 📄 文件元信息

- **文件路径**: `back-end/src/ai-qwen/guards.ts`
- **模块职责**: [代码访问与权限控制逻辑]
- **关联模块**: `[其他 guard 类、认证服务、API 网关等，用于跨文件检索]`

### 📦 API 知识条目

#### XGuard

```typescript
class XGuard {
  constructor(token: string, userId: number) {} // line16
}
```

- **语义标签**: [用户身份验证, JWT Token, 权限控制，异步处理]
- **完整签名**: `constructor(token: string, userId: number)`
- **设计意图**: 实现代码访问的初始化逻辑，确保 token 与用户 ID 关联。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | `token` | string | true | - | Token 标识符，用于身份验证 |
  | `userId` | number | false | 0 | 用户 ID，关联权限上下文 |
- **返回值/实例方法**: [构造函数]
- **使用约束**: [线程安全：无特殊要求；调用顺序需确保 token 与 userId 一致]
- **Code Review 检查点**: [验证 `token` 是否有效且未过期；确认 `userId` 是否存在于权限表，防止越权访问]

#### canActivate

```typescript
function canActivate(token: string, userId: number): boolean { // line17 }
```

- **语义标签**: [权限控制, Token验证, 异步处理]
- **完整签名**: `canActivate(token: string, userId: number)`: returns `boolean`
- **设计意图**: 判断当前用户是否具备访问特定资源的能力。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | `token` | string | true | - | Token，用于身份验证 |
  | `userId` | number | false | 0 | 用户 ID，关联权限上下文 |
- **返回值/实例方法**: [返回布尔值]
- **使用约束**: [线程安全：无特殊要求；调用顺序需确保 token 与 userId 一致]
- **Code Review 检查点**: [验证 `token` 是否有效且未过期；确认 `userId` 是否存在于权限表，防止越权访问]
