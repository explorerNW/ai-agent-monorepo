# `createMobxStore.ts` 技术文档

## 📖 文件概述

`createMobxStore.ts` 是一个基于 **MobX** 的状态管理工厂模块。该文件通过抽象 Store 的实例化流程，提供了一套类型安全、配置统一、可复用的 Store 创建机制。其核心目标是：

- 消除各业务 Store 中的重复样板代码（如 `makeAutoObservable`、配置注入等）
- 集中管理 Store 的运行时行为（调试、插件、严格模式等）
- 强化 TypeScript 类型推导，提升状态管理的可维护性与可测试性

> 📌 **架构定位**：属于状态管理层的基础设施（Infrastructure），通常被业务 Store 类或模块导入使用，不直接暴露给 UI 层。

---

## 🧩 接口定义

### `StoreOptions`

**位置**：第 5 行  
**类型**：`Interface`

#### 📝 说明

用于配置 Store 实例化行为的选项接口。该接口定义了工厂函数在创建 Store 时可接收的所有配置项，是 Store 运行时行为的契约。

#### 🔍 推断字段结构

```typescript
interface StoreOptions {
  /** Store 的唯一标识名称，常用于 DevTools 分组或日志追踪 */
  name?: string;
  /** 初始状态数据，支持部分覆盖或完整注入 */
  initialState?: Record<string, any>;
  /** 是否启用 MobX DevTools 调试面板 */
  enableDevtools?: boolean;
  /** 是否开启 MobX 严格模式（禁止非响应式修改） */
  strict?: boolean;
  /** 自定义插件或中间件数组（如日志、持久化、撤销重做等） */
  plugins?: Array<StorePlugin>;
  /** 其他扩展配置 */
  [key: string]: unknown;
}
```

#### 💼 业务意图推断

- **配置集中化**：避免在每个 Store 类中重复编写调试开关、严格模式等基础配置。
- **环境适配**：通过 `enableDevtools`、`strict` 等字段实现开发/生产环境的差异化行为。
- **扩展性预留**：`plugins` 字段为后续接入状态持久化、审计日志、时间旅行等能力提供标准化入口。

---

## ⚙️ 核心函数

### `createMobxStore`

**位置**：第 14 行  
**类型**：`Function`

#### 📝 说明

Store 工厂函数，负责接收 Store 类定义与配置选项，完成实例化、响应式转换、配置注入及插件挂载，最终返回一个完全可用的 MobX Store 实例。

#### 🔍 推断函数签名

```typescript
function createMobxStore<T extends object>(
  StoreClass: new (options?: StoreOptions) => T,
  options?: StoreOptions,
): T;
```

#### 📥 参数说明

| 参数名       | 类型                                | 必填 | 说明                                                                       |
| ------------ | ----------------------------------- | ---- | -------------------------------------------------------------------------- |
| `StoreClass` | `new (options?: StoreOptions) => T` | ✅   | 待实例化的 Store 类构造函数。需符合 MobX 类规范，支持接收 `StoreOptions`。 |
| `options`    | `StoreOptions`                      | ❌   | 实例化配置项。若未传入，将使用模块级默认配置。                             |

#### 📤 返回值

- **类型**：`T`（泛型约束为 `object`）
- **说明**：已应用 `makeAutoObservable`/`makeObservable`、注入配置、挂载插件的 Store 实例。类型完全继承自传入的 `StoreClass`。

#### 💼 业务意图推断

- **统一响应式规范**：在工厂内部统一调用 `makeAutoObservable`，避免开发者遗漏或误用响应式 API。
- **生命周期管控**：可在实例化前后统一执行初始化逻辑（如数据预加载、插件注册、DevTools 连接）。
- **类型安全闭环**：通过泛型 `T` 确保返回实例的类型与传入的 Store 类严格一致，IDE 可完整推导 `state` 与 `actions`。
- **单例/多例策略预留**：工厂模式便于后续扩展为单例缓存（如 `WeakMap` 缓存）或按需懒加载。

---

## 💡 架构价值与设计原则

| 原则         | 在本文件中的体现                                                    |
| ------------ | ------------------------------------------------------------------- |
| **单一职责** | 仅负责 Store 的创建与配置注入，不处理业务逻辑                       |
| **开闭原则** | 通过 `StoreOptions` 和 `plugins` 支持功能扩展，无需修改工厂核心逻辑 |
| **类型安全** | 泛型约束 + 接口契约，编译期拦截配置错误与类型不匹配                 |
| **可测试性** | 工厂函数易于 Mock，便于单元测试中隔离 Store 创建过程                |

---

## 📝 使用示例（推断）

```typescript
// 1. 定义业务 Store
class UserStore {
  username = "";
  isLoading = false;

  constructor(options?: StoreOptions) {
    // 工厂内部会处理 makeAutoObservable，此处可留空或处理初始数据
  }

  setUsername(name: string) {
    this.username = name;
  }
}

// 2. 使用工厂创建实例
const userStore = createMobxStore(UserStore, {
  name: "UserStore",
  enableDevtools: process.env.NODE_ENV === "development",
  strict: true,
  initialState: { username: "guest" },
});

// 3. 类型安全调用
userStore.setUsername("alice"); // ✅ TS 完整推导
```

---

## ⚠️ 说明与假设

1. 本文档基于文件名、导出结构及 **MobX 官方最佳实践** 进行架构级推断。实际字段名、泛型约束、内部实现可能因项目规范略有差异。
2. 若实际代码中包含 `makeAutoObservable`、`configure`、`applyMiddleware` 等调用，建议在文档中补充具体实现细节。
3. 推荐在 CI/CD 流程中结合 `tsc --noEmit` 与 `eslint-plugin-mobx` 验证该模块的类型与规范一致性。

> 🛠️ **维护建议**：当新增 Store 配置项或插件机制时，请同步更新 `StoreOptions` 接口定义，并补充 JSDoc 注释以确保 IDE 提示完整。
