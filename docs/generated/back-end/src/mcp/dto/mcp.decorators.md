### 📄 文件元信息

- **文件路径**: `back-end/src/mcp/dto/mcp.decorators.ts`
- **模块职责**: MCP (Model Context Protocol) 工具配置与参数定义管理
- **关联模块**: `mcp`, `dto`, `decorators`

---

### 📦 API 知识条目

#### McpResponse 成员全限定名

- **语义标签**: [用户认证，JWT, Token刷新，异步]
- **完整签名**: `typescript interface MCPResponse { id: string; status?: 'success' | 'error'; message?: string }`
- **设计意图**: 定义响应状态与消息字段，用于处理请求结果。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | id | string | ✓ | `""` | 唯一标识符 |
  | status | 'success'/'error' | ✗ | `'success'` | 请求状态码 |
  | message | string | ✗ | `[待确认]` | 响应消息内容 |
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<response>]
- **使用约束**: `await response; // 异步处理` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含状态码校验逻辑？（如：需验证响应是否为成功）
2. 消息字段是否存在空值或类型错误风险？

#### McpToolOptions 成员全限定名

- **语义标签**: [工具配置，异步处理，参数传递]
- **完整签名**: `typescript interface MCPToolOptions { name: string; description?: string }`
- **设计意图**: 定义可配置的工具选项信息。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | name | string | ✓ | `""` | 工具标识符 |
  | description | string | ✗ | `[待确认]` | 描述性文本（如：用于代码生成）
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<toolOptions>]
- **使用约束**: `await tool; // 异步调用工具` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含必要参数校验（如：描述字段必填）？
2. 是否存在类型转换或异常处理缺失风险？

#### McpResourceOptions 成员全限定名

- **语义标签**: [资源配置，异步请求]
- **完整签名**: `typescript interface MCPResourceOptions { name: string; description?: string }`
- **设计意图**: 定义可配置的资源选项信息。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | name | string | ✓ | `""` | 资源标识符 |
  | description | string | ✗ | `[待确认]` | 描述性文本（如：用于代码生成）
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<resourceOptions>]
- **使用约束**: `await resource; // 异步调用资源` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含必要参数校验（如：描述字段必填）？
2. 是否存在类型转换或异常处理缺失风险？

#### McpPromptOptions 成员全限定名

- **语义标签**: [提示词配置，异步生成]
- **完整签名**: `typescript interface MCPPromptOptions { name: string; description?: string }`
- **设计意图**: 定义可配置的提示词选项信息。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | name | string | ✓ | `""` | 提示标识符 |
  | description | string | ✗ | `[待确认]` | 描述性文本（如：用于代码生成）
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<promptOptions>]
- **使用约束**: `await prompt; // 异步调用提示词` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含必要参数校验（如：描述字段必填）？
2. 是否存在类型转换或异常处理缺失风险？

#### McpTool 成员全限定名

- **语义标签**: [工具执行，异步调用]
- **完整签名**: `typescript interface MCPTool { name: string; description?: string }`
- **设计意图**: 定义可执行的工具实例。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | name | string | ✓ | `""` | 工具标识符（如：用于代码生成）
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<tool>]
- **使用约束**: `await tool; // 异步调用工具` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含必要参数校验（如：描述字段必填）？
2. 是否存在类型转换或异常处理缺失风险？

#### McpResource 成员全限定名

- **语义标签**: [资源执行，异步调用]
- **完整签名**: `typescript interface MCPResource { name: string; description?: string }`
- **设计意图**: 定义可执行的资源实例。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | name | string | ✓ | `""` | 资源标识符（如：用于代码生成）
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<resource>]
- **使用约束**: `await resource; // 异步调用资源` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含必要参数校验（如：描述字段必填）？
2. 是否存在类型转换或异常处理缺失风险？

#### McpPrompt 成员全限定名

- **语义标签**: [提示词生成，异步调用]
- **完整签名**: `typescript interface MCPPrompt { name: string; description?: string }`
- **设计意图**: 定义可执行的提示词实例。
- **参数/属性契约**:
  | 名称 | 类型 | 可选 | 约束/默认值 | 语义说明 |
  |------|------|------|-------------|----------|
  | name | string | ✓ | `""` | 提示标识符（如：用于代码生成）
- **返回值/实例方法**: [无特殊约束，返回对象或 Promise<prompt>]
- **使用约束**: `await prompt; // 异步调用提示词` / `try { ... } catch (e) {}`
- **Code Review 检查点**:

1. 是否包含必要参数校验（如：描述字段必填）？
2. 是否存在类型转换或异常处理缺失风险？
