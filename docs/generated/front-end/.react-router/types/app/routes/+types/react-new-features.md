# `react-new-features.ts` 技术文档

## 1. 文件概述

`react-new-features.ts` 是一个面向现代 React 路由/全栈框架（高度契合 **Remix** 或 **React Router v7+** 规范）的核心类型定义文件。该文件不直接包含运行时逻辑，而是作为**类型契约层**，为路由模块（Route Module）提供完整的 TypeScript 类型支撑。

**核心架构定位：**

- **全栈数据流契约**：统一服务端（Server）与客户端（Client）的数据加载（Loader）、数据变更（Action）及中间件（Middleware）的类型签名。
- **渲染管线标准化**：规范路由组件、错误边界、水合加载状态的 Props 结构，保障 SSR/CSR 混合渲染的类型安全。
- **元数据与资源管理**：通过 `Meta`、`Links`、`Headers` 函数类型，将 SEO、样式资源、HTTP 响应头等关注点与业务逻辑解耦。

> 💡 **注**：以下参数与字段说明基于主流 React 路由框架的通用规范进行架构级推断，实际实现可能因框架版本略有差异。

---

## 2. 核心类型定义说明

### 2.1 路由上下文与模块结构

| 类型名称      | 类型签名推断                                                                                                                                                                                             | 参数/字段说明                                                      | 业务意图                                                                                            |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `Module`      | `type Module = { default: Component; loader?: LoaderFunction; action?: ActionFunction; meta?: MetaFunction; links?: LinksFunction; headers?: HeadersFunction; ErrorBoundary?: ErrorBoundaryComponent; }` | 路由模块的顶层导出集合。包含组件、数据函数、元数据函数及错误边界。 | 定义单个路由文件的标准结构，强制开发者遵循约定优于配置（Convention over Configuration）的模块规范。 |
| `Info`        | `type Info = { id: string; path?: string; handle?: unknown; component?: Component; }`                                                                                                                    | 路由静态配置信息，包含唯一标识、路径、自定义 handle 对象等。       | 用于路由注册表与配置解析，支撑动态路由生成与权限/特性标记。                                         |
| `Matches`     | `type Matches = Array<{ id: string; pathname: string; params: Params; data: unknown; handle: unknown; }>`                                                                                                | 当前 URL 匹配到的所有路由层级数组。                                | 提供嵌套路由上下文，支持父路由数据向子路由透传，常用于全局状态共享或权限校验。                      |
| `Annotations` | `type Annotations = Record<string, unknown>                                                                                                                                                              | Array<{ type: string; data: unknown }> `                           | 路由注解/标记集合，通常以键值对或结构化数组形式存在。                                               | 扩展路由元数据，用于中间件过滤、缓存策略标记或 AOP 切面注入。 |

### 2.2 资源与元数据函数

| 类型名称          | 类型签名推断                                                                                                              | 参数/字段说明                                                   | 业务意图                                                                   |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------- | :------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `LinkDescriptors` | `type LinkDescriptors = Array<{ rel?: string; href: string; as?: string; type?: string; crossOrigin?: string; }>`         | 描述 `<link>` 标签的数组，支持 CSS、JS、预取等资源。            | 定义路由关联的静态/动态资源，支持按路由按需加载样式或字体。                |
| `LinksFunction`   | `type LinksFunction = () => LinkDescriptors                                                                               | Promise<LinkDescriptors>`                                       | 无参或接收上下文的函数，返回资源描述符。                                   | 动态生成路由资源链接，常用于主题切换、多语言样式隔离或条件资源加载。         |
| `MetaArgs`        | `type MetaArgs = { data: unknown; params: Params; location: Location; }`                                                  | 元数据函数入参，包含 Loader 返回数据、路由参数、当前 Location。 | 为 SEO 标签生成提供运行时上下文，确保元数据与页面状态强一致。              |
| `MetaDescriptors` | `type MetaDescriptors = Array<{ title?: string; name?: string; content?: string; property?: string; charset?: string; }>` | 描述 `<meta>` 标签的数组。                                      | 定义页面元数据，直接映射至 HTML `<head>`，支撑搜索引擎优化与社交媒体分享。 |
| `MetaFunction`    | `type MetaFunction = (args: MetaArgs) => MetaDescriptors                                                                  | Promise<MetaDescriptors>`                                       | 接收 `MetaArgs` 返回元数据描述符的函数。                                   | 动态计算页面 Title、Description、OG 标签等，支持 SSR 直出与 CSR 更新。       |
| `HeadersArgs`     | `type HeadersArgs = { loaderHeaders: Headers; parentHeaders: Headers; actionHeaders?: Headers; }`                         | 包含当前路由及父级路由的 Headers 实例。                         | 提供 HTTP 响应头合并上下文，支持缓存策略、安全头、CORS 的层级继承。        |
| `HeadersFunction` | `type HeadersFunction = (args: HeadersArgs) => Headers                                                                    | Promise<Headers>`                                               | 接收 Headers 上下文，返回 `Headers` 实例或键值对。                         | 控制服务端响应头，常用于设置 `Cache-Control`、`Vary`、`X-Frame-Options` 等。 |

### 2.3 中间件与数据流契约

| 类型名称                   | 类型签名推断                                                                                           | 参数/字段说明                                                          | 业务意图                                                                  |
| :------------------------- | :----------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `MiddlewareFunction`       | `type MiddlewareFunction = (request: Request, next: () => Promise<Response>) => Response               | Promise<Response>`                                                     | 标准 Web 中间件签名，接收 Request 与 next 执行函数。                      | 服务端请求拦截器，用于全局鉴权、日志记录、请求体解析、错误包装等。 |
| `ClientMiddlewareFunction` | `type ClientMiddlewareFunction = (args: ClientLoaderArgs                                               | ClientActionArgs, next: () => Promise<unknown>) => unknown             | Promise<unknown>`                                                         | 客户端导航/数据请求拦截器。                                        | 客户端请求预处理，支持预取（Prefetch）、客户端缓存命中、状态同步或路由守卫。 |
| `LoaderArgs`               | `type LoaderArgs = { request: Request; params: Params; context: unknown; data?: unknown; }`            | 服务端 Loader 入参，包含 HTTP 请求、路由参数、全局上下文、父路由数据。 | 定义服务端数据获取的标准输入，保障全栈类型安全与依赖注入。                |
| `ClientLoaderArgs`         | `type ClientLoaderArgs = { request: Request; params: Params; serverLoader?: () => Promise<unknown>; }` | 客户端 Loader 入参，通常包含服务端 Loader 的代理函数。                 | 支持客户端独立数据获取或与服务端协同（如 BFF 模式），优化首屏后交互体验。 |
| `ActionArgs`               | `type ActionArgs = { request: Request; params: Params; context: unknown; data?: unknown; }`            | 服务端 Action 入参，结构同 LoaderArgs，但语义为数据变更。              | 定义服务端表单提交、API 调用、状态变更的标准输入，统一 Mutation 契约。    |
| `ClientActionArgs`         | `type ClientActionArgs = { request: Request; params: Params; serverAction?: () => Promise<unknown>; }` | 客户端 Action 入参，支持直接调用或代理服务端逻辑。                     | 支持客户端直接处理数据变更（如乐观更新、本地缓存写入），降低服务端负载。  |

### 2.4 组件属性定义

| 类型名称               | 类型签名推断                                                                                                       | 参数/字段说明                                      | 业务意图                                                                    |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------------- |
| `HydrateFallbackProps` | `type HydrateFallbackProps = { loaderData: unknown; }`                                                             | 水合加载状态组件 Props，通常包含初始 Loader 数据。 | 在 SSR 页面水合完成前展示 Loading UI，避免 FOUC（闪烁），提升首屏感知性能。 |
| `ComponentProps`       | `type ComponentProps = { loaderData: unknown; actionData?: unknown; params: Params; navigate: NavigateFunction; }` | 路由主组件 Props，包含数据、参数、导航方法。       | 定义路由组件接收的业务数据与交互能力，实现数据驱动视图渲染。                |
| `ErrorBoundaryProps`   | `type ErrorBoundaryProps = { error: unknown; resetErrorBoundary?: () => void; }`                                   | 错误边界组件 Props，包含捕获的错误实例与重置方法。 | 捕获路由渲染或数据加载异常，提供降级 UI 与重试机制，防止应用白屏崩溃。      |

---

## 3. 架构设计意图与工程建议

### 🔹 设计意图

1. **全栈类型安全**：通过严格区分 `*Args` 与 `Client*Args`，在编译期阻断服务端/客户端上下文混用，降低跨端调试成本。
2. **关注点分离（SoC）**：将数据获取（Loader/Action）、元数据（Meta/Links/Headers）、UI 渲染（Component/ErrorBoundary）解耦为独立导出，符合现代路由框架的“路由即模块”理念。
3. **渐进式增强**：`HydrateFallbackProps` 与 `ClientMiddlewareFunction` 的设计表明框架支持 SSR 优先、CSR 增强的渲染策略，兼顾 SEO 与交互流畅度。

### 🛠 架构师建议

- **运行时校验配合**：建议结合 `zod` 或 `valibot` 对 `LoaderArgs`/`ActionArgs` 的 `request` 与 `params` 进行运行时校验，实现 `TypeScript 类型 → 运行时 Schema` 的双向同步。
- **缓存策略规范**：在 `HeadersFunction` 中统一封装 `Cache-Control` 策略（如 `stale-while-revalidate`），避免各路由重复实现。
- **错误边界标准化**：为 `ErrorBoundaryProps` 提供全局默认实现，统一错误上报（Sentry/LogRocket）与用户提示 UI。
- **中间件链设计**：利用 `MiddlewareFunction` 构建可组合的中间件管道（如 `authMiddleware → rateLimitMiddleware → loggerMiddleware`），提升可维护性。

> 📌 本文档基于类型命名与 React 生态最佳实践生成。若需补充具体实现细节或对接特定框架版本，可提供完整源码片段进行精准映射。
