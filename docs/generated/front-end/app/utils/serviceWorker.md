# `serviceWorker.ts` 技术文档

## 📖 1. 文件概述

`serviceWorker.ts` 是一个面向 **PWA（渐进式 Web 应用）** 的 Service Worker 集中管控模块。该文件不直接注册 SW，而是作为 **主线程（Main Thread）与 Service Worker 通信的桥接层**，提供状态查询、版本更新检测、缓存生命周期管理及事件订阅能力。

**架构定位**：

- **职责边界**：封装浏览器原生 `navigator.serviceWorker` 与 `caches` API，屏蔽底层异步细节与兼容性差异。
- **设计模式**：采用函数式工具集 + 事件回调模式，保持无状态与高可测试性。
- **业务价值**：实现离线缓存、静默更新、用户可控的激活策略、缓存健康监控，显著提升首屏性能与弱网可用性。

---

## 🧱 2. 核心数据结构

### `ServiceWorkerStatus` (Interface)

| 属性                | 说明                                               | 推断类型                                                  |
| ------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `state`             | 当前 SW 生命周期状态                               | `'installing' \| 'activating' \| 'active' \| 'redundant'` |
| `isUpdateAvailable` | 是否存在待激活的新版本                             | `boolean`                                                 |
| `version`           | 当前激活的 SW 版本号（通常来自 `meta` 或构建哈希） | `string`                                                  |
| `registration`      | 关联的 `ServiceWorkerRegistration` 实例            | `ServiceWorkerRegistration \| null`                       |
| `lastChecked`       | 最后一次状态同步时间戳                             | `Date`                                                    |

**业务意图**：标准化 SW 状态上报格式，供 UI 层（如更新提示 Banner、调试面板）进行条件渲染与交互控制。

---

## ⚙️ 3. 核心功能模块

> 💡 注：以下参数与返回值基于 Web API 规范与命名惯例推断，实际签名以源码为准。

### 🔍 状态与生命周期管理

#### `checkServiceWorkerStatus()`

- **功能说明**：同步获取当前 Service Worker 的运行状态并返回结构化对象。
- **参数**：无（或可选 `registration: ServiceWorkerRegistration`）
- **返回值**：`Promise<ServiceWorkerStatus>`
- **业务意图**：应用初始化或路由切换时调用，确保 UI 状态与底层 SW 状态一致。常用于判断是否显示“更新可用”提示。

#### `onServiceWorkerUpdate(callback: (status: ServiceWorkerStatus) => void)`

- **功能说明**：注册 SW 更新相关的事件监听器，支持多订阅者模式。
- **参数**：
  - `callback`: 状态变更时的回调函数
- **返回值**：`() => void`（取消订阅函数）
- **业务意图**：解耦更新检测与 UI 响应。当 `checkForUpdates` 发现新版本或 SW 进入 `waiting` 状态时，自动触发回调，驱动前端交互。

### 🔄 版本更新控制

#### `checkForUpdates(registration?: ServiceWorkerRegistration)`

- **功能说明**：主动调用 `registration.update()` 触发版本检查，绕过浏览器默认的 24 小时更新策略。
- **参数**：
  - `registration`: 可选，未传则使用 `navigator.serviceWorker.ready`
- **返回值**：`Promise<boolean>`（`true` 表示发现新版本）
- **业务意图**：支持用户手动“检查更新”或关键业务场景下的强制版本校验，提升迭代效率。

#### `skipWaiting(registration: ServiceWorkerRegistration)`

- **功能说明**：向处于 `waiting` 状态的新版 SW 发送 `skipWaiting` 消息，使其立即激活。
- **参数**：
  - `registration`: 目标 SW 注册实例
- **返回值**：`Promise<void>`
- **业务意图**：实现“用户确认后即时生效”的体验。避免传统 SW 更新需刷新页面才能激活的割裂感，常用于配合 `onServiceWorkerUpdate` 使用。

### 🗄️ 缓存管理

#### `precacheUrls(urls: string[], cacheName: string)`

- **功能说明**：将指定 URL 列表批量预加载至命名缓存中。
- **参数**：
  - `urls`: 需要缓存的资源路径数组
  - `cacheName`: 缓存池名称（如 `app-v1.2.0`）
- **返回值**：`Promise<void>`
- **业务意图**：在 SW `install` 阶段或主线程初始化时调用，保障核心静态资源（HTML/CSS/JS/关键图片）离线可用，优化 FCP/LCP 指标。

#### `getCacheInfo(cacheName?: string)`

- **功能说明**：获取指定缓存或全局缓存的元数据（名称、大小、请求数量等）。
- **参数**：
  - `cacheName`: 可选，指定查询的缓存名
- **返回值**：`Promise<CacheMetadata[]>`（推断结构：`{ name: string, size: number, requestCount: number }`）
- **业务意图**：用于开发者调试面板、存储配额监控或自动清理策略（如超过 50MB 触发清理）。

#### `removeFromCache(cacheName: string, url: string)`

- **功能说明**：从指定缓存中精确删除单个资源。
- **参数**：
  - `cacheName`: 目标缓存名称
  - `url`: 需移除的资源完整 URL
- **返回值**：`Promise<boolean>`（是否成功删除）
- **业务意图**：精细化缓存治理。适用于移除过期接口数据、用户主动清除的本地文件，或修复因缓存污染导致的白屏问题。

#### `clearAllCaches()`

- **功能说明**：遍历并清空当前应用名下所有 Service Worker 缓存。
- **参数**：无
- **返回值**：`Promise<void>`
- **业务意图**：大版本升级、强制刷新或用户“清理缓存”操作时的兜底方案。建议配合 `precacheUrls` 重新初始化核心资源。

---

## 🏗️ 4. 架构设计与业务意图推断

| 设计维度     | 推断结论                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------- |
| **通信模型** | 主线程 → `postMessage` / `skipWaiting` → SW；SW → `updatefound` / `statechange` → 主线程     |
| **缓存策略** | 采用命名空间隔离（`cacheName` 版本化），支持 `Cache-First` 或 `Network-First` 策略的底层支撑 |
| **更新策略** | 静默检测 + 用户确认激活（`skipWaiting`），平衡更新及时性与用户体验                           |
| **类型安全** | 通过 `ServiceWorkerStatus` 统一状态契约，避免主线程与 SW 状态不同步导致的竞态条件            |
| **可观测性** | `getCacheInfo` 与状态回调提供运行时可观测入口，便于接入监控与埋点系统                        |

---

## 📌 5. 使用建议与最佳实践

1. **避免阻塞主线程**：所有函数均为异步操作，建议在 `useEffect` / `onMounted` 中调用，并配合 `AbortController` 管理生命周期。
2. **缓存版本管理**：`precacheUrls` 的 `cacheName` 建议与构建哈希绑定（如 `app-${__APP_VERSION__}`），旧版本缓存可在 `activate` 事件中自动清理。
3. **更新提示 UX**：结合 `onServiceWorkerUpdate` 与 `skipWaiting`，推荐实现“非模态提示 → 用户点击 → 调用 `skipWaiting` → 自动刷新”的交互流。
4. **错误边界**：`clearAllCaches` 与 `removeFromCache` 可能因浏览器配额限制或权限问题失败，建议包裹 `try/catch` 并降级处理。
5. **TypeScript 严格模式**：建议为 `ServiceWorkerStatus` 添加 `zod` 或 `io-ts` 运行时校验，防止 SW 消息格式变更导致主线程崩溃。

---

> 📝 **文档生成说明**：本文档基于提供的代码结构元数据，结合 Web API 规范、PWA 最佳实践与 TypeScript 工程经验进行架构级推断。实际参数签名、返回值类型及内部实现请以源码为准。如需补充具体实现细节或生成单元测试模板，可提供完整代码片段。
