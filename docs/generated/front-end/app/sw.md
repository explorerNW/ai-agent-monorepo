# `sw.ts` 服务 Worker 缓存策略核心模块文档

## 📖 文件概述

`sw.ts` 是前端应用 **Service Worker (SW)** 的核心逻辑文件，主要负责网络请求拦截、缓存策略分发与静态资源路由。基于提取的函数签名推断，该文件采用 **策略模式（Strategy Pattern）** 封装了三种主流的前端缓存策略，并提供了资源类型识别工具函数。整体架构面向 **PWA（渐进式 Web 应用）** 场景，旨在实现离线可用、首屏极速加载与动态数据新鲜度之间的平衡。

> 📌 **注**：输入数据仅包含函数/方法节点，未提取到类、接口或类型定义。以下文档基于标准 Service Worker API 与 TypeScript 工程实践进行合理推断与补全。

---

## 🏗️ 架构设计推断

| 维度                | 推断结论                                                        |
| :------------------ | :-------------------------------------------------------------- |
| **核心职责**        | 请求路由分发、缓存读写控制、网络降级处理                        |
| **设计模式**        | 策略模式（缓存策略抽象）、工厂/路由模式（`isStaticAsset` 分流） |
| **依赖 API**        | `CacheStorage`、`Request`、`Response`、`fetch()`                |
| **执行上下文**      | Service Worker 全局作用域 (`self` / `globalThis`)               |
| **TypeScript 特征** | 强类型请求/响应处理、异步 Promise 链、泛型缓存键管理            |

---

## 📚 API 详细说明

### 1. `cacheFirstStrategy`

- **所在行**：`83`
- **推断签名**：
  ```ts
  function cacheFirstStrategy(request: Request): Promise<Response>;
  ```
- **功能说明**：实现 **缓存优先** 策略。优先从本地缓存读取响应；若缓存命中则直接返回，未命中则发起网络请求，并将新响应写入缓存后返回。
- **参数解释**：
  - `request: Request`：浏览器拦截的原始网络请求对象，包含 URL、Headers、Method 等元数据。
- **业务意图**：
  - 适用于**不频繁变更的静态资源**（如 JS/CSS 构建产物、字体、图标、第三方 SDK）。
  - 最大化离线可用性，消除重复网络请求，显著降低 TTFB（首字节时间）。
- **典型流程**：`cache.match()` → 命中则 `return` → 未命中则 `fetch()` → `cache.put()` → `return response`

---

### 2. `networkFirstStrategy`

- **所在行**：`103`
- **推断签名**：
  ```ts
  function networkFirstStrategy(request: Request): Promise<Response>;
  ```
- **功能说明**：实现 **网络优先** 策略。优先尝试网络请求；成功则更新缓存并返回最新数据；网络失败时降级返回缓存中的旧数据。
- **参数解释**：
  - `request: Request`：原始请求对象，通常用于 API 接口或动态内容拉取。
- **业务意图**：
  - 适用于**强一致性要求的动态数据**（如用户信息、订单状态、实时配置）。
  - 保证数据新鲜度的同时，提供网络异常时的优雅降级体验，避免白屏或报错。
- **典型流程**：`try { fetch() }` → 成功则 `cache.put()` + `return` → `catch` → `cache.match()` → `return fallback`

---

### 3. `staleWhileRevalidateStrategy`

- **所在行**：`131`
- **推断签名**：
  ```ts
  function staleWhileRevalidateStrategy(request: Request): Promise<Response>;
  ```
- **功能说明**：实现 **陈旧但可重新验证** 策略。立即返回缓存中的响应（若有），同时在后台静默发起网络请求更新缓存。若缓存为空，则直接走网络请求。
- **参数解释**：
  - `request: Request`：请求对象，通常用于内容型资源（如文章列表、商品目录、新闻 feed）。
- **业务意图**：
  - 适用于**对实时性要求不高但需快速响应的内容**。
  - 兼顾用户体验（秒开）与数据最终一致性，后台更新不影响当前渲染，下次请求即可命中新缓存。
- **典型流程**：`cache.match()` → 返回旧响应 → `Promise.all([response, fetch().then(cache.put)])` → 后台更新

---

### 4. `isStaticAsset`

- **所在行**：`154`
- **推断签名**：
  ```ts
  function isStaticAsset(url: string | Request): boolean;
  ```
- **功能说明**：资源类型识别工具函数。根据请求 URL 或 Request 对象判断是否为静态资产。
- **参数解释**：
  - `url: string | Request`：请求地址字符串或完整的 Request 实例。
- **业务意图**：
  - 作为 **请求路由网关**，决定后续应调用哪种缓存策略。
  - 通常通过正则匹配文件后缀（`.js`, `.css`, `.png`, `.woff2` 等）或特定路径前缀（`/static/`, `/assets/`）进行判定。
- **典型实现逻辑**：
  ```ts
  const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|woff2|ttf|ico)$/i;
  return STATIC_EXTENSIONS.test(url instanceof Request ? url.url : url);
  ```

---

## 🔄 策略路由与业务映射

在实际的 `fetch` 事件监听器中，该文件通常配合如下路由逻辑使用：

```ts
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (request.url.includes("/api/")) {
    event.respondWith(networkFirstStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});
```

| 资源类型            | 推荐策略                       | 核心指标                 |
| :------------------ | :----------------------------- | :----------------------- |
| 构建产物 / 媒体资源 | `cacheFirstStrategy`           | 离线率 ↑、带宽 ↓         |
| 业务 API / 用户数据 | `networkFirstStrategy`         | 数据一致性 ↑、容错率 ↑   |
| 内容列表 / 营销页   | `staleWhileRevalidateStrategy` | 首屏速度 ↑、后台更新透明 |

---

## 💡 架构师建议与 TypeScript 最佳实践

1. **缓存版本管理**  
   建议引入 `CACHE_VERSION` 常量，并在 `cache.open()` 时拼接版本号（如 `app-v1.2.0`）。版本升级时自动清理旧缓存，避免内存泄漏与脏数据。

2. **类型安全增强**

   ```ts
   // 推荐定义策略函数类型
   type CacheStrategy = (request: Request) => Promise<Response>;
   const strategies: Record<string, CacheStrategy> = {
     cacheFirst: cacheFirstStrategy,
     networkFirst: networkFirstStrategy,
     staleWhileRevalidate: staleWhileRevalidateStrategy,
   };
   ```

3. **错误边界与日志**  
   Service Worker 运行在独立线程，错误不会阻塞主线程但会导致策略失效。建议在每个策略外层包裹 `try/catch`，并通过 `console.warn` 或自定义遥测上报网络降级事件。

4. **与 Workbox 的权衡**  
   当前实现为轻量级原生方案，适合中小型项目。若业务复杂度上升（需支持路由预缓存、缓存配额管理、插件链），建议逐步迁移至 `workbox-precaching` / `workbox-routing`，但可保留本文件作为自定义策略的扩展层。

5. **TypeScript 编译配置注意**  
   Service Worker 使用 `lib: ["WebWorker"]` 而非 `"DOM"`，确保 `self`、`CacheStorage` 等类型正确解析。若使用 Vite/Webpack，需配置正确的 `target` 与 `polyfill`。

---

📅 **文档版本**：v1.0 | 🛠️ **适用场景**：PWA 离线架构 / 前端性能优化 / Service Worker 定制开发  
如需补充具体实现代码或缓存生命周期管理逻辑，可提供完整 AST 或源码片段进行深度审查。
