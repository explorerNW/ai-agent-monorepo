### 📄 文件元信息

- **文件路径**: `back-end/src/mcp/mcp.discovery.service.ts`
- **模块职责**: MCP Discovery Service（代码分析工具发现服务）
- **关联模块**: FileAnalysisService、McpTextResponse

---

### 📦 API 知识条目

#### AnalyzeFilesInput

- **语义标签**: 文件输入，项目配置，待处理文档列表，解析任务入口
- **完整签名**: `typescript {type: 'FileAnalysisRequest', name: 'AnalyzeFilesInput'}`
- **设计意图**: 定义接收待分析文件的请求参数结构。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | files | File[] | true | [] | 文件列表，包含文件名、路径等字段 |
  | projectName | string | false | undefined | 项目名称标识分析目标环境 |
- **返回值/实例方法**: `FileAnalysisResult`（返回解析结果）
- **使用约束**: 无特殊约束；需确保输入数据格式合法。
- **Code Review 检查点**:

1. 是否包含必填字段文件列表？
2. 项目名称是否正确映射到分析环境？

#### McpTextResponse

- **语义标签**: MCP 响应，文本处理结果，解析输出，工具调用返回
- **完整签名**: `typescript {type: 'McpTextResponse', name: 'McpTextResponse'}`
- **设计意图**: 封装文件分析的文本处理与结构化输出。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | textContent | string | false | undefined | MCP 返回的解析内容字符串 |
- **返回值/实例方法**: `McpTextResponse`（文本处理结果）
- **使用约束**: 无特殊约束；需确保输出格式符合预期。
- **Code Review 检查点**:

1. 是否包含必要字段如 content、metadata？
2. 响应内容是否与输入文件解析一致？

#### FileAnalysisService

- **语义标签**: 核心服务，文件分析逻辑，工具调用管理，配置项维护
- **完整签名**: `typescript {type: 'FileAnalysisService', name: 'FileAnalysisService'}`
- **设计意图**: 提供代码分析的通用处理框架。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | files | File[] | true | [] | 待分析文件列表，支持动态添加或更新 |
  | projectName | string | false | undefined | 项目标识符用于任务隔离 |
- **返回值/实例方法**: `analyzeSelectedFiles`（执行解析操作）
- **使用约束**:

1. 无特殊线程安全要求；
2. 调用顺序需保证文件列表有序处理。

- **Code Review 检查点**:

1. 是否支持动态添加新文件或更新配置？
2. 是否有错误日志记录机制用于调试？

#### constructor

- **语义标签**: 构造函数，初始化状态与配置项管理
- **完整签名**: `typescript {type: 'FileAnalysisService', name: 'constructor'}`
- **设计意图**: 定义服务初始化和参数设置逻辑。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | config | FileAnalysisConfig | false | undefined | 配置项，如分析模式、超时时间等 |
- **返回值/实例方法**: `init()`（初始化服务）
- **使用约束**:

1. 无特殊线程安全要求；
2. 需确保参数传递顺序正确。

- **Code Review 检查点**:

1. 是否包含必要的配置项？
2. 是否有默认值处理逻辑缺失风险？

#### analyzeSelectedFiles

- **语义标签**: 核心方法，文件解析执行，工具调用管理，异常捕获与日志记录
- **完整签名**: `typescript {type: 'FileAnalysisService', name: 'analyzeSelectedFiles'}`
- **设计意图**: 实现文件的实际分析逻辑。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | files | File[] | true | [] | 待解析文件列表，支持动态添加或更新 |
- **返回值/实例方法**: `analyzeSelectedFiles`（执行分析操作）
- **使用约束**:

1. 无特殊线程安全要求；
2. 调用顺序需保证文件列表有序处理。

- **Code Review 检查点**:

1. 是否包含错误日志记录机制？
2. 是否有异常捕获与重试逻辑缺失风险？

---

### 📥 输入代码结构

```json
{
  "type": "Type",
  "name": "AnalyzeFilesInput",
  "line": 25,
  "is_export": true
}
```
