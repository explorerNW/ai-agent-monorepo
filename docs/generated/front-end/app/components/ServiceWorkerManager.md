# `ServiceWorkerManager.tsx` 技术文档

> 📌 **文档说明**：基于您提供的提取结构（仅包含入口函数/方法 `ServiceWorkerManager`），本文档以资深 TypeScript 架构师视角，结合现代 Web 应用 Service Worker 管理标准模式，补全了完整的架构说明、类型推断、方法契约与业务意图。所有推断均遵循 React + TypeScript 生态的最佳实践。

---

## 1. 文件概述

`ServiceWorkerManager.tsx` 是前端应用中负责 **Service Worker 全生命周期管理** 的核心模块。该文件通常以单例模式或工厂函数形式暴露，用于解耦 Service Worker 的注册、更新检测、缓存策略控制、客户端通信及更新提示 UI 的触发逻辑。

由于文件后缀为 `.tsx`，该模块可能同时提供：

- 底层 TypeScript 管理类/工厂函数
- 面向 React 的 Hook 或 Context 封装（便于在组件树中响应 SW 状态变更）

**核心职责**：

- ✅ 安全注册与卸载 Service Worker
- ✅ 版本更新检测与 `skipWaiting` / `clients.claim` 协调
- ✅ 客户端与 SW 之间的 `postMessage` 通信桥接
- ✅ 缓存策略配置与离线降级处理
- ✅ 状态机管理（`idle` → `registering` → `ready` → `updating` → `outdated`）

---

## 2. 核心结构说明

### 2.1 `ServiceWorkerManager` (Function/Method)

| 属性         | 说明                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **定位**     | 模块入口 / 构造函数 / 工厂方法                                                                                                                                |
| **所在行**   | `line: 3`                                                                                                                                                     |
| **签名推断** | `export function ServiceWorkerManager(config?: SWConfig): SWManagerInstance`                                                                                  |
| **参数说明** | `config`（可选）：配置对象，包含 SW 脚本路径、更新检查间隔、缓存策略、事件回调等                                                                              |
| **返回值**   | 返回一个包含生命周期控制方法、状态订阅接口和通信方法的单例实例                                                                                                |
| **业务意图** | 作为应用与 Service Worker 之间的唯一控制面。避免在多个组件中重复注册或状态冲突，提供统一的配置入口与状态暴露机制，便于后续集成 React 状态管理或全局通知系统。 |

---

## 3. 推断的接口与类型定义（架构规范补全）

> ⚠️ 注：以下类型基于标准 Service Worker 管理架构推断，实际项目中应与提取结构对齐。

```ts
// 状态枚举
export type SWStatus =
  | "idle"
  | "registering"
  | "ready"
  | "updating"
  | "outdated"
  | "error";

// 配置接口
export interface SWConfig {
  scriptUrl?: string; // Service Worker 脚本路径，默认 '/sw.js'
  updateCheckInterval?: number; // 自动检查更新间隔（ms），默认 60000
  cacheStrategy?: "cache-first" | "network-first" | "stale-while-revalidate";
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Error) => void;
}

// 管理器实例接口
export interface SWManagerInstance {
  status: SWStatus;
  register(): Promise<ServiceWorkerRegistration>;
  unregister(): Promise<boolean>;
  checkForUpdate(): Promise<boolean>;
  skipWaiting(): Promise<void>;
  claimClients(): Promise<void>;
  postMessage(data: any): void;
  subscribeStatus(callback: (status: SWStatus) => void): () => void;
  destroy(): void;
}
```

---

## 4. 核心方法说明（基于标准生命周期推断）

| 方法名                | 参数                   | 返回值                               | 业务意图                                                                                        |
| --------------------- | ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `register()`          | 无                     | `Promise<ServiceWorkerRegistration>` | 触发 SW 注册流程，处理浏览器兼容性降级，返回注册实例供后续操作使用                              |
| `unregister()`        | 无                     | `Promise<boolean>`                   | 安全卸载 SW，常用于开发环境热更新或用户主动关闭离线功能                                         |
| `checkForUpdate()`    | 无                     | `Promise<boolean>`                   | 主动调用 `registration.update()`，返回是否发现新版本，用于“检查更新”按钮逻辑                    |
| `skipWaiting()`       | 无                     | `Promise<void>`                      | 通知后台等待的 SW 立即激活，中断当前页面缓存策略，常用于强制更新场景                            |
| `claimClients()`      | 无                     | `Promise<void>`                      | 激活新 SW 后接管所有客户端窗口，确保新缓存策略立即生效                                          |
| `postMessage(data)`   | `data: any`            | `void`                               | 向 SW 发送指令（如预缓存、清除缓存、同步队列），需配合 SW 端 `self.addEventListener('message')` |
| `subscribeStatus(cb)` | `cb: (status) => void` | `() => void`                         | 状态订阅器，返回取消订阅函数。便于 React 组件通过 `useEffect` 响应 SW 状态变化                  |
| `destroy()`           | 无                     | `void`                               | 清理定时器、移除事件监听、释放实例，防止内存泄漏（SPA 路由切换或 HMR 场景必需）                 |

---

## 5. 业务意图与架构设计

### 🎯 核心业务价值

1. **无缝更新体验**：通过状态机控制 `updating` → `skipWaiting` → `claimClients` 流程，避免用户操作中断或缓存不一致。
2. **离线与性能优化**：结合 `cacheStrategy` 配置，实现首屏加速、弱网降级、后台预加载。
3. **解耦与可测试性**：将 SW 逻辑从 UI 组件剥离，提供纯函数/类接口，便于单元测试与 Mock。
4. **React 集成友好**：`.tsx` 后缀暗示可能导出 `useServiceWorker` Hook，通过 `subscribeStatus` 驱动 UI 更新（如更新提示弹窗）。

### 🏗️ 架构建议

- **单例约束**：使用模块级闭包或 `WeakMap` 确保全局唯一实例，防止重复注册。
- **类型安全通信**：定义 `SWMessagePayload` 联合类型，避免 `postMessage` 数据污染。
- **错误边界**：所有异步操作包裹 `try/catch`，并通过 `onError` 回调上报至监控平台（如 Sentry）。
- **环境隔离**：开发环境默认 `updateCheckInterval: 0` 并自动 `skipWaiting`，生产环境需用户确认。

---

## 6. 使用示例

```tsx
// app/sw-init.ts
import { ServiceWorkerManager, SWConfig } from "./ServiceWorkerManager";

const swConfig: SWConfig = {
  scriptUrl: "/sw.prod.js",
  updateCheckInterval: 300_000,
  cacheStrategy: "stale-while-revalidate",
  onUpdate: (reg) => {
    console.log("🔄 新版本 Service Worker 已就绪");
    // 可在此触发全局通知或更新弹窗
  },
};

export const swManager = ServiceWorkerManager(swConfig);

// 在 React 组件中使用
import { useEffect, useState } from "react";
import { swManager } from "./app/sw-init";

export function UpdateBanner() {
  const [status, setStatus] = useState<SWStatus>("idle");

  useEffect(() => {
    const unsubscribe = swManager.subscribeStatus(setStatus);
    return unsubscribe;
  }, []);

  if (status === "updating") {
    return (
      <div className="sw-update-banner">
        发现新版本，
        <button onClick={() => swManager.skipWaiting()}>立即更新</button>
      </div>
    );
  }
  return null;
}
```

---

## 7. 注意事项与最佳实践

| 类别            | 建议                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔒 **安全要求** | Service Worker 仅在 `HTTPS` 或 `localhost` 下生效，需确保部署环境合规                                                                             |
| 🧪 **调试策略** | 使用 `chrome://serviceworker-internals` 查看状态、作用域与缓存；开发期建议 `navigator.serviceWorker.getRegistration().then(r => r?.unregister())` |
| 📦 **缓存治理** | 避免无限制缓存，实现 `cache.version` 命名空间隔离，定期清理旧版本缓存                                                                             |
| 🔄 **更新提示** | 不要自动 `skipWaiting`，应提供用户确认按钮，避免打断当前表单填写或文件上传                                                                        |
| 📱 **兼容性**   | 检查 `window.serviceWorker` 存在性，老旧浏览器需降级为普通缓存或提示升级                                                                          |
| 🧹 **内存管理** | 务必在组件卸载或应用销毁时调用 `destroy()` 或取消状态订阅，防止事件监听泄漏                                                                       |

---

📎 **文档版本**：`v1.0.0`  
👨‍💻 **维护角色**：TypeScript 架构师 / 前端基础设施组  
🔍 **下一步建议**：若需精准映射实际代码，请提供完整的 AST 提取结果（含类定义、接口、方法签名及装饰器），本架构师将输出逐行级代码注释与重构建议。
