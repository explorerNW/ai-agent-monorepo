### 📄 文件元信息

- **文件路径**: `back-end/src/mcp/tools/file-analysis.service.ts`
- **模块职责**: MCP (Model Context Protocol) 工具封装代码分析、数据验证与异常处理逻辑，支持异步执行和跨端调用管理
- **关联模块**: MCP Tools, File Analysis Service

### 📦 API 知识条目

#### ClassFileAnalysisService成员全限定名

- **语义标签**: `MCP`, `Async`, `Validation`, `ErrorHandling`
- **完整签名**: ```typescript
  class FileAnalysisService {
  analyzeSelectedFiles(fileList: File[], options?: AnalysisOptions): Promise<FileAnalysisResult>
  }

````
- **设计意图**: 封装文件分析逻辑，支持异步处理与异常捕获机制。解决复杂代码结构下的数据验证问题。
- **参数/属性契约**:
| 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
|------|------|------|-------------|----------|
| fileList | File[] | true | - | 文件列表输入，支持异步处理 |
| options | AnalysisOptions? | false | { timeout: number, maxDepth?: number } | 分析选项配置参数（超时、深度限制） |

- **返回值/实例方法**: `Promise<FileAnalysisResult>` (返回结果对象)
- **使用约束**:
  - 异步执行，需处理 Promise 回调
  - 线程安全：依赖外部工具类互斥锁保护
  - 调用顺序：先解析文件结构，再验证数据完整性

#### ClassFileAnalysisService成员全限定名（导出）
```typescript
export class FileAnalysisService {
    analyzeSelectedFiles(fileList: File[], options?: AnalysisOptions): Promise<FileAnalysisResult>
}

// 注意：未定义返回类型或方法签名时标注为待确认，确保代码审查可追溯。
````
