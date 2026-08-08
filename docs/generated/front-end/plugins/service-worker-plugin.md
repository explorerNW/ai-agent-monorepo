# `service-worker-plugin.ts` 技术文档

> 📌 **文档定位**：本文档基于提取的代码结构，结合 Vite/Rollup 插件规范与 Service Worker 最佳实践，进行架构级推断与技术说明。适用于前端架构师、构建工具开发者及高级前端工程师参考。

---

## 📖 文件概述

`service-worker-plugin.ts` 是一个面向现代前端构建工具（如 Vite / Rollup）的 **Service Worker 自动化集成插件**。其核心职责是在构建生命周期中完成 Service Worker 的源码处理、缓存哈希生成、注册脚本注入及构建后收尾工作。

**架构特征**：

- 遵循标准 Vite/Rollup Plugin API 规范，采用工厂函数模式暴露插件实例。
- 内部职责分离清晰：配置解析、资源处理、哈希计算、脚本注入各司其职。
- 强类型驱动：通过 `ServiceWorkerPluginOptions` 提供完整的类型约束，保障配置安全与 IDE 智能提示。
- 无侵入设计：通过构建钩子自动注入注册逻辑，无需业务代码手动维护 `navigator.serviceWorker.register()`。

---

## 🧩 核心结构说明

### 1. `ServiceWorkerPluginOptions` (Interface)

**说明**：插件配置的类型定义接口，用于约束用户传入的初始化参数。

**典型结构推断**：

```ts
interface ServiceWorkerPluginOptions {
  src?: string; // Service Worker 源码路径
  outFile?: string; // 输出文件名（默认 sw.js）
  registerType?: "auto" | "manual" | "prompt"; // 注册策略
  scope?: string; // SW 控制范围
  hash?: boolean | string; // 是否启用内容哈希（用于缓存击穿）
  inject?: boolean; // 是否自动注入注册脚本到入口文件
  onUpdate?: string; // 自定义更新回调逻辑路径
}
```

**参数解释**：
| 参数 | 类型 | 说明 |
|------|------|------|
| `src` | `string` | SW 源码相对路径，支持 `.ts`/`.js` |
| `outFile` | `string` | 构建后输出的 SW 文件名，支持占位符如 `[hash]` |
| `registerType` | `enum` | 控制浏览器更新行为：自动刷新/手动提示/静默更新 |
| `scope` | `string` | 限定 SW 拦截的网络请求路径范围 |
| `hash` | `boolean \| string` | 启用后基于文件内容生成哈希，强制浏览器重新注册 |
| `inject` | `boolean` | 是否自动向主入口注入 `registerSW()` 调用 |

**业务意图推断**：提供声明式配置能力，降低业务团队接入 PWA 的门槛；通过策略枚举与哈希控制，平衡用户体验与缓存更新可靠性。

---

### 2. `serviceWorkerPlugin` (Factory Function)

**说明**：插件工厂函数，接收配置并返回符合 Vite/Rollup 规范的插件对象。

**签名推断**：

```ts
function serviceWorkerPlugin(options?: ServiceWorkerPluginOptions): Plugin;
```

**参数解释**：

- `options`：可选配置对象，内部会与默认配置合并（`Object.assign(defaults, options)`）。

**业务意图推断**：作为插件唯一入口，负责初始化内部状态、校验配置合法性、绑定生命周期钩子，并返回插件实例。采用工厂模式便于单元测试与多实例隔离。

---

### 3. `configResolved` (Plugin Hook)

**说明**：构建配置解析完成后的钩子，用于早期校验与路径解析。

**签名推断**：

```ts
function configResolved(config: ResolvedConfig): void;
```

**参数解释**：

- `config`：Vite/Rollup 最终解析后的配置对象，包含 `root`、`base`、`build.outDir` 等关键信息。

**业务意图推断**：

- 将相对路径（如 `src`、`outFile`）转换为绝对路径。
- 校验 `src` 文件是否存在，防止构建期静默失败。
- 检查 `scope` 与 `base` 是否冲突，提前抛出配置错误。
- 初始化内部缓存状态（如哈希映射表、注入标记）。

---

### 4. `generateBundle` (Plugin Hook)

**说明**：资源打包生成阶段的钩子，执行核心处理逻辑。

**签名推断**：

```ts
function generateBundle(
  outputOptions: OutputOptions,
  bundle: OutputBundle,
): void | Promise<void>;
```

**参数解释**：

- `outputOptions`：当前输出配置（格式、目标、sourcemap 等）。
- `bundle`：内存中的资源包对象，可通过 `this.emitFile()` 或 `bundle[name] = ...` 注入新资源。

**业务意图推断**：

- 读取并编译 `src` 指定的 SW 源码（支持 TS 编译或 AST 转换）。
- 调用 `createHash` 生成内容指纹，替换输出文件名中的 `[hash]`。
- 调用 `injectRegistrationScript` 生成注册代码，并注入到主入口 chunk 或 HTML 模板。
- 将处理后的 SW 文件写入 `bundle`，确保与主包同步输出。

---

### 5. `closeBundle` (Plugin Hook)

**说明**：构建流程结束前的收尾钩子，用于清理与状态同步。

**签名推断**：

```ts
function closeBundle(error?: Error | null): void | Promise<void>;
```

**参数解释**：

- `error`：构建过程中是否发生异常。

**业务意图推断**：

- 若构建成功，输出 SW 文件路径、哈希值、注册脚本注入位置等日志。
- 清理临时文件、释放 AST 缓存或关闭编译进程。
- 可选：触发 CI/CD 钩子（如上传 SW 到 CDN、生成 `manifest.json` 关联）。
- 若 `error` 存在，执行安全降级或错误上报。

---

### 6. `createHash` (Internal Utility)

**说明**：内部工具函数，用于生成文件内容哈希值。

**签名推断**：

```ts
function createHash(
  content: string | Buffer,
  algorithm?: "sha256" | "md5",
): string;
```

**参数解释**：

- `content`：待计算哈希的原始内容（SW 源码或编译后代码）。
- `algorithm`：哈希算法，默认 `sha256`，兼顾安全性与性能。

**业务意图推断**：

- 实现缓存击穿（Cache Busting）：文件名带哈希可强制浏览器重新下载 SW。
- 用于完整性校验或生成 `integrity` 属性。
- 纯函数设计，无副作用，便于独立测试与复用。

---

### 7. `injectRegistrationScript` (Internal Utility)

**说明**：内部工具函数，动态生成并返回 Service Worker 注册脚本。

**签名推断**：

```ts
function injectRegistrationScript(
  swPath: string,
  options: Pick<
    ServiceWorkerPluginOptions,
    "registerType" | "scope" | "onUpdate"
  >,
): string;
```

**参数解释**：

- `swPath`：构建后 SW 文件的相对路径（如 `/sw.[hash].js`）。
- `options`：注册策略相关配置子集。

**业务意图推断**：

- 根据 `registerType` 生成不同策略的注册代码（如 `auto` 直接注册，`prompt` 添加更新提示 UI 逻辑）。
- 自动处理 `scope` 路径拼接与 `navigator.serviceWorker.ready` 状态管理。
- 返回标准 JS 字符串，供 `generateBundle` 注入到入口文件末尾或 HTML `<script>` 中。
- 避免硬编码，提升插件可维护性与跨项目兼容性。

---

## 🔄 架构工作流推断

```mermaid
graph LR
  A[serviceWorkerPlugin(options)] --> B[configResolved]
  B -->|路径解析/配置校验| C[generateBundle]
  C -->|读取SW源码| D[createHash]
  C -->|生成注册代码| E[injectRegistrationScript]
  D & E --> C
  C -->|注入bundle| F[closeBundle]
  F -->|日志/清理/上报| G[构建完成]
```

**关键设计原则**：

1. **生命周期驱动**：严格遵循构建工具钩子顺序，避免阻塞主流程。
2. **职责单一**：配置解析、资源处理、哈希计算、脚本注入解耦，符合 SOLID 原则。
3. **类型安全**：全链路使用 TypeScript 约束，减少运行时配置错误。
4. **可观测性**：在 `closeBundle` 暴露构建结果，便于监控与调试。

---

## 💡 架构师建议与最佳实践

| 维度         | 建议                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **性能优化** | `createHash` 建议采用流式计算（`crypto.createHash().update()`），避免大文件内存峰值。                    |
| **兼容性**   | 注入的注册脚本应包含 `if ('serviceWorker' in navigator)` 降级判断，兼容旧浏览器。                        |
| **更新策略** | 推荐默认使用 `registerType: 'auto'`，但提供 `onUpdate` 钩子供业务自定义提示 UI。                         |
| **测试覆盖** | 为 `createHash` 和 `injectRegistrationScript` 编写单元测试；使用 `@vitejs/plugin` 测试套件验证钩子行为。 |
| **扩展性**   | 可预留 `transform` 钩子，允许用户传入自定义 SW 源码转换器（如注入环境变量）。                            |

---

📎 **备注**：本文档基于结构元数据与行业标准插件模式进行推断。实际实现细节可能因项目上下文略有差异，建议结合源码注释与单元测试进行最终对齐。如需补充具体实现逻辑或类型定义，可提供完整源码片段进行深度审查。
