```markdown
# agent-context.types.ts

## 文件概述

该文件定义了与代理上下文相关的接口和类型，用于在代理系统中传递和处理请求和依赖项。

## 接口

### AgentInvokeContext

**说明：**
`AgentInvokeContext` 接口表示代理调用的上下文信息。它包含了执行代理操作所需的所有必要数据。

**参数解释：**

- **无明确参数，但包含属性：**
- `input: AgentInput`: 输入参数对象。
- `deps: AgentDeps`: 依赖项对象。

### AgentInput

**说明：**
`AgentInput` 接口表示代理操作的输入参数。它包含了执行代理操作所需的所有必要数据。

**参数解释：**

- **无明确参数，但包含属性：**
- `requestId: string`: 请求的唯一标识符。
- `data: any`: 请求的具体数据。

### AgentDeps

**说明：**
`AgentDeps` 接口表示代理操作所需的依赖项。它包含了执行代理操作所需的所有必要资源和服务。

**参数解释：**

- **无明确参数，但包含属性：**
- `logger: ILogger`: 日志记录器。
- `config: IConfig`: 配置对象。
- `serviceClient: IServiceClient`: 服务客户端。
```

这个 Markdown 文档结构清晰地概述了文件中的接口和类型，并提供了每个接口的详细说明和参数解释。
