### 📄 文件元信息

- **文件路径**: `front-end/.react-router/types/app/routes/+types/Chat.ts`
- **模块职责**: [前端路由类型定义与 Chat API 交互封装]
- **关联模块**: `frontend/router`, `chat-api-types`, `error-boundary-utils`

### 📦 API 知识条目

#### 🔐 Token 刷新接口成员全限定名

- **语义标签**: JWT, TokenRefresh, Async, RetryPolicy
- **完整签名**: ```typescript
  export interface RefreshTokenRequest {
  refreshToken: string;
  }

```
- **设计意图**: [处理异步请求中的 token 更新逻辑]
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| refreshToken | string | true | "null" | Token refresh request payload |
| retryPolicy | RetryPolicyConfig | false | { maxRetries: 3 } | Max retries for failed requests |

- **返回值/实例方法**: [无特殊约束]
- **使用约束**: [线程安全，异步请求需处理超时]
- **Code Review 检查点**: [验证 refreshToken 是否有效、重试策略配置是否正确]
```
