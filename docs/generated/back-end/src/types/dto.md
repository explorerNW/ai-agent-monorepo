### 📄 文件元信息

- **文件路径**: `back-end/src/types/dto.ts`
- **模块职责**: TypeScript DTO 类型定义与后端数据契约规范（支持认证、响应格式及权限校验）
- **关联模块**: DifyResponse, GitHubWebhookPayload

---

### 📦 API 知识条目

#### 🔐 GitHubWebhookPayload 成员全限定名

- **语义标签**: `用户认证`, `JWT`, `Token刷新`, `异步`
- **完整签名**: ```typescript
  interface GitHubWebhookPayload {
  tokenId: string; // required, unique identifier for authentication tokens
  userId?: number | null; // optional user ID or null if not authenticated
  payload?: Record<string, any>; // JSON-formatted request data (e.g., webhook event)
  webhookUrl?: string; // URL to trigger the webhook handler
  }

````
- **设计意图**: 处理 GitHub Webhook 请求，确保认证信息正确传递并验证身份合法性。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| tokenId | string | required | unique identifier for authentication tokens | Required field to identify the authenticated user's session ID. |
| userId | number|null | optional | null if not authenticated; otherwise, a numeric user ID or null value indicating unauthenticated status. | Optional parameter allowing users to specify their own identity without explicit token validation. |
| payload | Record<string, any> | required | JSON-formatted request data (e.g., webhook event) | Required field containing the actual request payload for processing logic. |
| webhookUrl | string | optional | URL to trigger the webhook handler | Optional endpoint configuration for initiating callback handlers asynchronously. |
- **返回值/实例方法**: `GitHubWebhookPayload` 对象，支持构造和验证逻辑。
- **使用约束**: 调用方需确保 payload 字段类型正确转换；若未提供 tokenId，将触发默认认证流程并返回错误提示。

#### 🔒 DifyResponse 成员全限定名
- **语义标签**: `响应格式`, `DifyAPI` |
- **完整签名**: ```typescript
interface DifyResponse {
    success: boolean; // true if successful, false otherwise.
    data?: Record<string, any>; // optional response structure with fields like 'message', 'code' and others.
}
````

- **设计意图**: 定义响应格式规范，确保后端返回的数据结构符合预期。
- **参数/属性契约**:

| 名称    | 类型                | 可选     | 约束/默认值                                                                      | 语义说明                                                                                                                      |
| ------- | ------------------- | -------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| success | boolean             | required | true if successful, false otherwise.                                             | Indicates whether the request was processed successfully or failed with an error code and message.                            |
| data    | Record<string, any> | optional | Optional response structure containing fields like 'message', 'code' and others. | Required field for detailed information about the API call result; null indicates no specific details provided by the caller. |

- **返回值/实例方法**: `DifyResponse` 对象，支持构造和验证逻辑。

#### 🔗 DifyFileUploadResponse 成员全限定名

- **语义标签**: `文件上传`, `响应格式`, `异步处理`
- **完整签名**: ```typescript
  interface DifyFileUploadResponse {
  file: File; // The uploaded file object.
  }

```
- **设计意图**: 定义文件上传的响应结构，确保数据完整性。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| file | File | required | The uploaded file object. | Required field containing the actual file data for processing logic (e.g., image, document). |
- **返回值/实例方法**: `DifyFileUploadResponse` 对象，支持构造和验证逻辑。

---

### 📋 Code Review Checkpoints
1. GitHubWebhookPayload: Verify tokenId is unique and valid; ensure payload type matches expected JSON structure without nulls or missing fields.
2. DifyResponse: Confirm success flag reflects actual API response status (e.g., 400 for invalid request, 500 for server error).
3. DifyFileUploadResponse: Validate file object is non-null and contains valid data types; ensure no unexpected nulls in the payload structure.
```
