# `api.ts` 技术文档

## 📖 文件概述

`api.ts` 是客户端（通常为前端或 BFF 层）的 **API 服务封装模块**，核心职责是提供类型安全的 AI 对话交互能力、流式响应处理机制以及 Web 性能数据采集接口。  
从提取的结构来看，该文件遵循 **契约驱动开发（Contract-Driven Development）** 理念，通过 `Interface` 严格定义前后端数据交换格式，并通过函数层封装网络请求、流式解析与性能监控逻辑。整体架构偏向于 **高内聚、低耦合** 的服务层设计，适用于现代 AI 对话应用或实时交互型 Web 产品。

---

## 🧩 类型定义 (Interfaces)

> 💡 注：以下字段结构基于行业通用规范（如 OpenAI API、Web Vitals 标准）及函数上下文推断，实际实现请以源码为准。

### `ChatMessage` (第 8 行)

- **说明**：对话消息的基础数据单元，用于表示单条用户输入或 AI 回复。
- **推断结构**：
  ```ts
  interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    id?: string;
    timestamp?: number;
    metadata?: Record<string, any>;
  }
  ```
- **参数/字段解释**：
  - `role`：消息角色，决定上下文传递方向与模型行为。
  - `content`：消息正文内容。
  - `id` / `timestamp`：用于消息去重、排序与本地缓存索引。
- **业务意图推断**：标准化多轮对话历史，支持上下文窗口管理、消息持久化及权限/角色隔离（如系统提示词注入）。

### `ChatRequest` (第 13 行)

- **说明**：向 AI 服务发起对话请求的载荷结构。
- **推断结构**：
  ```ts
  interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
    user?: string;
  }
  ```
- **参数/字段解释**：
  - `messages`：历史对话上下文数组。
  - `stream`：是否启用流式返回，直接影响底层网络处理策略。
  - `temperature` / `maxTokens`：控制模型生成随机性与输出长度。
  - `user`：用户标识，用于审计、限流或个性化路由。
- **业务意图推断**：构建符合 RESTful/兼容协议的请求体，提供模型参数调优能力，支持按需切换流式/阻塞模式。

### `ChatResponse` (第 17 行)

- **说明**：AI 服务返回的响应数据结构。
- **推断结构**：
  ```ts
  interface ChatResponse {
    id: string;
    choices: Array<{
      index: number;
      message: ChatMessage;
      finishReason: "stop" | "length" | "content_filter";
    }>;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    created: number;
  }
  ```
- **参数/字段解释**：
  - `choices`：模型生成的候选回复列表（通常单条）。
  - `finishReason`：生成终止原因，用于前端状态提示（如“内容被过滤”、“达到长度限制”）。
  - `usage`：Token 消耗统计，用于计费展示或成本监控。
- **业务意图推断**：解析后端返回结果，提取有效回复、终止状态与资源消耗，为 UI 渲染、计费逻辑与异常提示提供数据支撑。

---

## ⚙️ 核心函数 (Functions)

### `sendChatMessage` (第 27 行)

- **说明**：发起 AI 对话请求的核心网络函数。
- **推断签名**：
  ```ts
  function sendChatMessage(
    request: ChatRequest,
  ): Promise<ChatResponse | ReadableStream>;
  ```
- **参数解释**：
  - `request`：符合 `ChatRequest` 契约的请求载荷。
- **业务意图推断**：
  - 封装 HTTP POST 请求，处理鉴权 Header、超时控制与基础错误拦截。
  - 根据 `request.stream` 动态决定返回完整 `Promise<ChatResponse>` 或 `ReadableStream`，实现模式路由。
  - 可能内置重试机制（如网络抖动重试）与请求日志埋点。

### `getWebVitalsStats` (第 62 行)

- **说明**：采集并返回当前页面的核心 Web 性能指标。
- **推断签名**：
  ```ts
  function getWebVitalsStats(): Promise<WebVitalsReport>;
  ```
- **参数解释**：无显式参数（可能依赖全局 Performance API 或内部配置）。
- **业务意图推断**：
  - 聚合 LCP（最大内容绘制）、FID/INP（交互延迟）、CLS（累积布局偏移）、TTFB（首字节时间）等指标。
  - 用于性能监控大盘上报、弱网降级策略触发或用户体验质量（UX Quality）评估。
  - 通常与 `sendChatMessage` 解耦，便于在路由切换或对话空闲期异步采集。

### `processStream` (第 88 行)

- **说明**：流式响应数据解析与分发处理器。
- **推断签名**：
  ```ts
  function processStream(
    response: Response,
    onChunk: (text: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
  ): void;
  ```
- **参数解释**：
  - `response`：Fetch API 返回的原始 Response 对象。
  - `onChunk`：每收到一个数据块时的回调，用于 UI 增量渲染。
  - `onComplete` / `onError`：流结束或异常时的生命周期钩子。
- **业务意图推断**：
  - 使用 `response.body.getReader()` 逐块读取 SSE/文本流，解析 JSON Lines 或纯文本。
  - 通过回调模式解耦数据流与视图层，避免阻塞主线程，实现“打字机”效果。
  - 内置断流恢复、乱码过滤与异常捕获逻辑，保障流式交互的稳定性。

---

## 🏗️ 架构视角与演进建议

| 维度         | 当前设计评估                              | 架构优化建议                                                                                    |
| :----------- | :---------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **类型安全** | 使用 Interface 明确契约，符合 TS 最佳实践 | 建议补充 `ErrorType` 联合类型，统一 API 错误响应结构；考虑使用 `zod` 或 `io-ts` 进行运行时校验  |
| **流式处理** | 独立 `processStream` 函数职责清晰         | 可封装为 `EventEmitter` 或 `AsyncIterator`，提升组合性；添加 `AbortController` 支持用户主动中断 |
| **性能监控** | `getWebVitalsStats` 独立暴露，便于集成    | 建议与对话请求绑定生命周期（如 `onRequestStart`/`onResponseEnd`），实现端到端性能追踪           |
| **可测试性** | 函数粒度适中，易于 Mock                   | 建议将 HTTP 客户端（如 `fetch`/`axios`）注入为依赖，便于单元测试与多环境切换                    |
| **扩展性**   | 当前结构支持基础 AI 对话场景              | 若后续支持多模态（图片/文件），建议将 `ChatMessage.content` 泛型化为 `ContentBlock[]` 结构      |

> 📌 **架构师提示**：该模块已具备生产级 API 层雏形。建议在后续迭代中引入 **请求拦截器链**、**响应缓存策略（如 SWR/React Query 集成）** 与 **结构化日志追踪（TraceID）**，以进一步提升可观测性与维护效率。
