### 📄 文件元信息

- **文件路径**: `back-end/src/mcp/dto/mcp-response.dto.ts`
- **模块职责**: MCP 响应 DTO 定义，封装 API 调用与业务状态管理逻辑（含认证、Token 刷新等）
- **关联模块**: [需根据实际导入导出关系补充其他相关接口/服务文件]

### 📦 API 知识条目

#### McpResponse

```typescript
export interface McpResponse {
  // ... (具体字段)
}
```

**语义标签**: `认证`, `Token刷新`, `异步`  
**完整签名**: ```typescript
interface McpResponse<T extends Record<string, any>> {
id: string;
status: 'success' | 'error';
data?: T; // 可选数据对象，如用户信息、操作结果等
}

````
- **设计意图**: 定义 API 响应结构体，用于代码审查时验证调用方是否遵循标准格式。
**参数/属性契约**:

| 名称   | 类型     | 可选 | 约束/默认值      | 语义说明                  |
|--------|----------|------|------------------|---------------------------|
| id    | string   | -    | `required`       | API 唯一标识符              |
| status | 'success' | -    | `'error'`        | 响应状态码                |
| data  | T      | ?    | `{}`             | 业务数据对象，如用户信息、操作结果等 |

- **返回值/实例方法**: `data?: T; // 可选参数，返回业务相关数据结构。若为 null，则无额外字段；否则需处理空值校验逻辑`
**使用约束**: [异步调用时需注意线程安全（避免阻塞主流程）]

#### McpSuccessResult
```typescript
export interface McpSuccessResult<T> {
  // ... (具体字段)
}
````

- **设计意图**: 封装成功响应结果，用于代码生成任务中验证 API 返回的完整性与一致性。  
  **参数/属性契约**:

| 名称   | 类型      | 可选 | 约束/默认值 | 语义说明                             |
| ------ | --------- | ---- | ----------- | ------------------------------------ |
| id     | string    | -    | `required`  | API 唯一标识符                       |
| status | 'success' | ?    | `'error'`   | 响应状态码                           |
| data   | T         | ?    | `{}`        | 业务数据对象，如用户信息、操作结果等 |

- **返回值/实例方法**: `data?: T; // 可选参数，返回业务相关数据结构。若为 null，则无额外字段；否则需处理空值校验逻辑`  
  **使用约束**: [异步调用时需注意线程安全（避免阻塞主流程）]

### 📥 输入代码结构

```json
{
    "type": "Interface",
    "name": "McpResponse",
    "line": 1,
    "is_export": true
}

{"type":"Interface","name":"McpSuccessResult","line":12,"is_export":true}
```
