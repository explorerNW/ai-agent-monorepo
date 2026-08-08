# `createZustandStore.ts` 技术文档

## 📖 文件概述

基于文件名 `createZustandStore.ts` 与提取的代码结构，该文件的核心定位是 **Zustand 状态管理工厂模块**。它通过封装底层 `zustand/create` API，提供一套类型安全、可配置、可复用的 Store 创建机制。主要设计目标包括：

- **统一中间件注入**：集中管理 `persist`、`devtools`、`immer` 等常用中间件，避免业务代码重复配置。
- **强化 TypeScript 支持**：通过泛型推导与类型约束，实现状态切片（Slice）的自动类型补全与编译期校验。
- **降低样板代码**：将 Store 初始化、配置合并、实例导出等流程标准化，提升开发效率与代码一致性。
- **环境适配**：支持根据运行环境（开发/生产）动态调整调试与持久化策略。

> 📌 **注**：当前提取数据仅包含单一函数声明。本文档结合 Zustand 官方规范、TypeScript 架构惯例及企业级状态管理最佳实践进行结构化推断，实际实现请以源码为准。

---

## 🔍 API 详细说明

### `createCustomStore`

| 属性         | 说明                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| **类型**     | `Function / Method`                                                                                 |
| **位置**     | 第 4 行                                                                                             |
| **签名推断** | `function createCustomStore<T>(stateCreator: StateCreator<T>, options?: StoreOptions): StoreApi<T>` |

#### 📝 功能说明

核心工厂函数，用于创建并返回一个经过预配置与类型强化的 Zustand Store 实例。该函数接收状态创建逻辑与可选配置项，自动完成中间件链组装、类型推导与实例初始化，是全局状态管理的统一入口。

#### 📥 参数解释（基于架构惯例推断）

- `stateCreator` (`StateCreator<T>`)
  - **说明**：定义 Store 的初始状态、动作（actions）及状态更新逻辑。
  - **签名**：`(set: SetState<T>, get: GetState<T>, store: StoreApi<T>) => T`
  - **用途**：业务开发者在此编写状态读写逻辑，工厂函数负责将其包装为可观测的 Store。
- `options` (`StoreOptions`, 可选)
  - `persist?: boolean | PersistOptions`：是否启用状态持久化及存储策略（如 `localStorage`、`sessionStorage`、自定义存储引擎）。
  - `devtools?: boolean`：是否接入 Redux DevTools 进行状态时间旅行与调试。
  - `middleware?: Middleware[]`：自定义中间件扩展数组，支持按需注入日志、权限校验、数据同步等逻辑。
  - `name?: string`：Store 唯一标识，用于调试面板命名与持久化键名生成。

#### 📤 返回值

- `StoreApi<T>`：Zustand 标准 Store 实例，包含 `getState`、`setState`、`subscribe`、`destroy` 等核心方法。泛型 `T` 已完整推导，确保调用方获得精确的类型提示。

#### 💡 业务意图推断

1. **架构收敛**：将分散在各模块的 `create()` 调用收口至单一工厂，便于全局管控状态生命周期、中间件策略与性能优化。
2. **类型安全优先**：通过泛型 `T` 与 Zustand 原生类型系统深度绑定，杜绝运行时状态类型错误，提升大型项目可维护性。
3. **开箱即用**：默认注入生产环境最佳实践（如不可变更新、持久化、调试工具），业务开发者仅需关注状态逻辑本身。
4. **可测试性增强**：工厂模式便于在单元测试中 Mock 配置项或替换中间件，实现隔离测试与快照对比。

---

## 🛠️ 典型使用示例（推断）

```typescript
import { createCustomStore } from "./createZustandStore";

// 1. 定义状态类型
interface UserState {
  user: { id: string; name: string } | null;
  isLoading: boolean;
  fetchUser: (id: string) => Promise<void>;
}

// 2. 使用工厂创建 Store
const useUserStore = createCustomStore<UserState>(
  (set, get) => ({
    user: null,
    isLoading: false,
    fetchUser: async (id) => {
      set({ isLoading: true });
      // ... 请求逻辑
      set({ user: { id, name: "Alice" }, isLoading: false });
    },
  }),
  {
    name: "user-store",
    persist: { storage: localStorage },
    devtools: process.env.NODE_ENV === "development",
  },
);

// 3. 组件中使用（自动获得类型提示）
// const { user, fetchUser } = useUserStore();
```

---

## 🏗️ 架构建议与最佳实践

- **切片化设计（Slice Pattern）**：建议将 `stateCreator` 拆分为独立函数，通过 `createCustomStore` 组合，提升状态模块的内聚性与可复用性。
- **中间件按需加载**：利用 `options` 控制中间件注入，避免生产环境加载调试工具或冗余持久化逻辑，优化包体积与启动性能。
- **类型导出规范**：建议同步导出 `StoreApi<T>` 或自定义 Hook 类型，便于跨模块类型共享与 Mock 测试。
- **单例保障**：Zustand 默认单例，工厂函数应保持引用一致性，避免重复创建导致状态丢失或订阅泄漏。
- **错误边界处理**：建议在工厂内部对 `stateCreator` 执行结果进行基础校验，防止非法状态结构导致运行时崩溃。

---

> ⚠️ **文档说明**  
> 本文档基于提供的有限代码结构（仅含 `createCustomStore` 函数声明）结合 Zustand 官方规范与 TypeScript 架构最佳实践生成。实际参数签名、返回值类型及内部实现请以源码为准。如需精准文档，请提供完整函数签名、类型定义或源码片段。
