### 📄 文件元信息

- **文件路径**: `back-end/src/code-review/code-review.service.ts`
- **模块职责**: Code Review Service 提供代码审查、Diff 处理及状态管理功能，支持异步调用与 Webhook 集成。
- **关联模块**: `code-review`, `diff-service`, `review-api`

### 📦 API 知识条目

#### DiffChunk 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  interface DiffChunk {
  line: number;
  }

````
- **设计意图**: 定义代码片段结构，用于后续解析与审查。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| line | number | true | - | 表示切片位置（0-based） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 DiffChunk 是否包含有效代码片段；确认 `line` 字段为整数且非负值。]

#### ReviewService 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
class ReviewService {
    constructor() {} // 构造函数未定义，需根据实际业务扩展
}
````

- **设计意图**: 封装代码审查逻辑与状态管理。
- **参数/属性契约**:

| 名称 | 类型   | 可选 | 约束/默认值 | 语义说明            |
| ---- | ------ | ---- | ----------- | ------------------- |
| line | number | true | -           | 切片位置（0-based） |

- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `line` 字段是否有效；确认是否存在未定义的成员属性。]

#### handleWebhook 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  function handleWebhook(event: { type: 'webhook'; data?: any }): void; // 无参数，需根据实际业务扩展

````
- **设计意图**: Webhook 处理逻辑，支持事件驱动架构。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| type | string | true | - | 事件类型标识（如 'diff'） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `type` 字段是否有效；确认是否存在未定义的成员属性。]

#### cleanAndSliceDiff 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
function cleanAndSliceDiff(diff: string): { line: number; } | undefined; // 无参数，需根据实际业务扩展
````

- **设计意图**: 清理 Diff 字符串并切片处理。
- **参数/属性契约**:

| 名称 | 类型   | 可选 | 约束/默认值 | 语义说明                      |
| ---- | ------ | ---- | ----------- | ----------------------------- |
| diff | string | true | -           | 待处理的代码片段（如 `line`） |

- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `diff` 是否包含有效代码；确认是否存在未定义的成员属性。]

#### splitDiffByFile 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  function splitDiffByFile(diff: string): { file?: 'file'; } | undefined; // 无参数，需根据实际业务扩展

````
- **设计意图**: 按文件分割 Diff。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| diff | string | true | - | 待处理的代码片段（如 `line`） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `diff` 是否包含有效代码；确认是否存在未定义的成员属性。]

#### shouldExcludeFile 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
function shouldExcludeFile(file: string): boolean; // 无参数，需根据实际业务扩展
````

- **设计意图**: 判断文件是否应被排除。
- **参数/属性契约**:

| 名称 | 类型   | 可选 | 约束/默认值 | 语义说明                      |
| ---- | ------ | ---- | ----------- | ----------------------------- |
| file | string | true | -           | 待处理的代码片段（如 `line`） |

- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `file` 是否包含有效文件；确认是否存在未定义的成员属性。]

#### sliceFileDiff 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  function sliceFileDiff(diff: string): { file?: 'file'; } | undefined; // 无参数，需根据实际业务扩展

````
- **设计意图**: 切片处理代码片段。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| diff | string | true | - | 待处理的代码片段（如 `line`） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `diff` 是否包含有效文件；确认是否存在未定义的成员属性。]

#### splitByHunks 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
function splitByHunks(diff: string): { file?: 'file'; } | undefined; // 无参数，需根据实际业务扩展
````

- **设计意图**: 按分块分割 Diff。
- **参数/属性契约**:

| 名称 | 类型   | 可选 | 约束/默认值 | 语义说明                      |
| ---- | ------ | ---- | ----------- | ----------------------------- |
| diff | string | true | -           | 待处理的代码片段（如 `line`） |

- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `diff` 是否包含有效文件；确认是否存在未定义的成员属性。]

#### createStatus 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  function createStatus(status: string): { type?: 'success'; } | undefined; // 无参数，需根据实际业务扩展

````
- **设计意图**: 创建状态标识。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| status | string | true | - | 待处理的状态（如 `line`） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `status` 是否包含有效状态；确认是否存在未定义的成员属性。]

#### determineStatus 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
function determineStatus(status: string): { type?: 'success'; } | undefined; // 无参数，需根据实际业务扩展
````

- **设计意图**: 确定状态类型。
- **参数/属性契约**:

| 名称   | 类型   | 可选 | 约束/默认值 | 语义说明                  |
| ------ | ------ | ---- | ----------- | ------------------------- |
| status | string | true | -           | 待处理的状态（如 `line`） |

- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `status` 是否包含有效状态；确认是否存在未定义的成员属性。]

#### callDifyReview 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  function callDifyReview(diff: string): { file?: 'file'; } | undefined; // 无参数，需根据实际业务扩展

````
- **设计意图**: 调用 Dify API。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| diff | string | true | - | 待处理的代码片段（如 `line`） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `diff` 是否包含有效文件；确认是否存在未定义的成员属性。]

#### uploadDiffFile 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
function uploadDiffFile(diff: string): { file?: 'file'; } | undefined; // 无参数，需根据实际业务扩展
````

- **设计意图**: 上传 Diff。
- **参数/属性契约**:

| 名称 | 类型   | 可选 | 约束/默认值 | 语义说明                      |
| ---- | ------ | ---- | ----------- | ----------------------------- |
| diff | string | true | -           | 待处理的代码片段（如 `line`） |

- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `diff` 是否包含有效文件；确认是否存在未定义的成员属性。]

#### postGithubComment 成员全限定名

- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
  function postGithubComment(comment: string): { file?: 'file'; } | undefined; // 无参数，需根据实际业务扩展

````
- **设计意图**: 提交 GitHub 评论。
- **参数/属性契约**:

| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| comment | string | true | - | 待处理的代码片段（如 `line`） |
- **返回值/实例方法**: [无]
- **使用约束**: [异步调用，线程安全]
- **Code Review 检查点**: [验证 `comment` 是否包含有效文件；确认是否存在未定义的成员属性。]

#### extractErrorMessage 成员全限定名
- **语义标签**: [用户认证, JWT, Token刷新, 异步]
- **完整签名**: ```typescript
function extractErrorMessage(error: string): { file?: 'file';
````
