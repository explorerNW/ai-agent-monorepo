# `useServiceWorker.ts` 技术文档

> 📌 **说明**：本文档基于您提供的结构数据（`UseServiceWorkerReturn` 接口与 `useServiceWorker` 函数）及命名规范生成。由于未提供完整源码，以下类型签名、参数定义及业务逻辑均基于 **React Hooks 规范**、**Service Worker API 标准** 及 **企业级 PWA 架构实践** 进行合理推断。实际开发中请以源码为准。

---

## 📖 文件概述

`useServiceWorker.ts` 是一个面向 React 生态的 **自定义 Hook**，用于封装浏览器 Service Worker 的生命周期管理、注册、更新检测、消息通信及兼容性处理。该模块旨在将底层异步、事件驱动的 `navigator.serviceWorker` API 转化为声明式、响应式的状态管理接口，降低业务组件与 PWA 能力耦合度，提升代码可维护性与类型安全性。

**核心职责**：

- 检测浏览器对 Service Worker 的支持情况
- 异步注册并监听 SW 状态变更（`installing` / `activated` / `redundant`）
- 监听版本更新事件，提供热更新提示与刷新能力
- 提供与 SW 双向通信的标准化通道
- 统一错误处理与状态机管理

---

## 🧩 接口定义

### `UseServiceWorkerReturn`

**位置**：第 11 行  
**类型**：`Interface`

#### 📐 推断类型签名

```typescript
export interface UseServiceWorkerReturn {
  /** 浏览器是否支持 Service Worker */
  isSupported: boolean;
  /** 是否已完成注册 */
  isRegistered: boolean;
  /** 当前活跃的 Service Worker 注册实例 */
  registration: ServiceWorkerRegistration | null;
  /** 是否有新版本可用 */
  updateAvailable: boolean;
  /** 当前生命周期状态 */
  status: "idle" | "registering" | "ready" | "updating" | "error";
  /** 触发应用刷新以激活新 SW */
  refreshApp: () => void;
  /** 向 Service Worker 发送消息 */
  postMessage: (data: any) => void;
  /** 注册/激活过程中捕获的错误信息 */
  error: Error | null;
}
```

#### 📝 字段说明与业务意图

| 字段              | 类型                                | 说明                    | 业务意图推断                                                  |
| ----------------- | ----------------------------------- | ----------------------- | ------------------------------------------------------------- |
| `isSupported`     | `boolean`                           | 浏览器是否支持 SW API   | 用于降级策略或 UI 提示（如不支持 PWA 功能时隐藏相关入口）     |
| `isRegistered`    | `boolean`                           | 是否成功完成注册        | 控制依赖 SW 的功能模块（如离线缓存、推送）的加载时机          |
| `registration`    | `ServiceWorkerRegistration \| null` | 当前 SW 注册实例        | 供高级场景直接调用原生 API（如 `registration.pushManager`）   |
| `updateAvailable` | `boolean`                           | 是否检测到新 SW 版本    | 驱动“发现更新”提示 UI，支持用户手动确认刷新                   |
| `status`          | `enum`                              | 状态机标识              | 统一生命周期视图，便于调试、埋点或加载动画控制                |
| `refreshApp`      | `() => void`                        | 刷新当前页面以激活新 SW | 提供安全的更新入口，避免直接 `location.reload()` 导致状态丢失 |
| `postMessage`     | `(data: any) => void`               | 向 SW 发送消息          | 实现主线程与后台线程通信（如触发后台同步、缓存清理）          |
| `error`           | `Error \| null`                     | 注册或通信异常          | 统一错误边界处理，便于上报监控或展示 Toast                    |

---

## ⚙️ 核心函数

### `useServiceWorker`

**位置**：第 24 行  
**类型**：`Function/Method`（React Custom Hook）

#### 📐 推断函数签名

```typescript
export function useServiceWorker(config?: {
  /** SW 脚本路径，默认 '/sw.js' */
  swUrl?: string;
  /** 注册配置项，如 { scope: '/', updateViaCache: 'none' } */
  options?: RegistrationOptions;
  /** 检测到更新时的回调 */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  /** 收到 SW 消息时的回调 */
  onMessage?: (event: MessageEvent) => void;
}): UseServiceWorkerReturn;
```

#### 📝 参数说明与业务意图

| 参数               | 类型                  | 说明            | 业务意图推断                                           |
| ------------------ | --------------------- | --------------- | ------------------------------------------------------ |
| `config.swUrl`     | `string`              | SW 入口文件路径 | 支持多环境/多模块独立 SW 部署（如主应用与微前端隔离）  |
| `config.options`   | `RegistrationOptions` | 原生注册配置    | 控制作用域、缓存策略、更新频率等底层行为               |
| `config.onUpdate`  | `Function`            | 更新检测回调    | 允许业务层自定义更新提示逻辑（如弹窗、埋点、静默更新） |
| `config.onMessage` | `Function`            | 消息接收回调    | 解耦通信逻辑，支持业务按需处理 SW 推送的数据           |

#### 🔄 内部执行流程推断

1. **兼容性检查**：通过 `navigator.serviceWorker` 判断 `isSupported`
2. **状态初始化**：使用 `useState` 初始化 `UseServiceWorkerReturn` 各字段
3. **注册与监听**：在 `useEffect` 中调用 `navigator.serviceWorker.register()`，绑定 `updatefound`、`controllerchange`、`message` 等事件
4. **状态同步**：根据事件流更新 `status`、`updateAvailable`、`registration` 等响应式状态
5. **清理机制**：组件卸载时移除事件监听，防止内存泄漏
6. **返回对象**：返回符合 `UseServiceWorkerReturn` 接口的状态与方法集合

---

## 🏗️ 架构设计与最佳实践

| 设计维度       | 实现策略                                   | 架构价值                                    |
| -------------- | ------------------------------------------ | ------------------------------------------- |
| **类型安全**   | 全量使用 TypeScript 接口约束返回值与配置项 | 编译期拦截误用，提升 IDE 智能提示体验       |
| **状态管理**   | 基于 React Hooks 的响应式状态机            | 避免手动操作 DOM/事件总线，符合现代前端范式 |
| **关注点分离** | 将注册、更新、通信、错误处理封装为独立方法 | 业务组件仅需消费状态，无需了解 SW 底层细节  |
| **可测试性**   | 纯函数 + 副作用隔离（`useEffect`）         | 便于单元测试 Mock `navigator.serviceWorker` |
| **扩展性**     | 预留 `onUpdate` / `onMessage` 回调钩子     | 支持不同业务线自定义更新策略与通信协议      |

---

## 💡 典型使用场景（推断）

```tsx
const { isSupported, updateAvailable, refreshApp, status } = useServiceWorker({
  swUrl: "/service-worker.js",
  onUpdate: (reg) => console.log("发现新版本，等待用户确认"),
});

if (!isSupported) return <p>您的浏览器不支持离线功能</p>;
if (status === "registering") return <Spinner />;

return (
  <div>
    <p>状态: {status}</p>
    {updateAvailable && (
      <button onClick={refreshApp}>发现新版本，点击刷新</button>
    )}
  </div>
);
```

---

## ⚠️ 注意事项

1. 本文档中的类型签名与参数结构为 **架构级推断**，实际字段名、可选性、泛型约束请以源码为准。
2. 若项目使用 `workbox` 或 `vite-plugin-pwa` 等构建插件，建议检查该 Hook 是否与插件生成的 SW 逻辑存在冲突。
3. 生产环境建议配合 `navigator.serviceWorker.ready` 与 `skipWaiting()` / `clientsClaim()` 策略，确保更新平滑过渡。
4. 如需支持多 SW 实例或作用域隔离，可在 `config` 中扩展 `scope` 或 `instanceId` 字段。

---

📅 **文档版本**：v1.0  
👨‍💻 **维护角色**：TypeScript 架构师 / PWA 技术负责人  
🔍 **下一步建议**：提供完整源码或 JSDoc 注释，可进一步输出精确的 API 契约、单元测试用例与性能优化方案。
