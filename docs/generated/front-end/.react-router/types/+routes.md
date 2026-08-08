# `+routes.ts` 技术架构文档

## 📖 文件概述

`+routes.ts` 是项目中**路由类型声明与注册中心**的核心文件。基于文件名约定（`+` 前缀常见于 TanStack Router、SolidStart 或现代文件系统路由框架）及提取的类型结构，该文件采用 **Type-Level Routing（类型级路由）** 架构模式。

**核心职责：**

- 通过 TypeScript 类型系统实现路由的**编译期校验**与**自动补全**，消除运行时字符串路由的拼写错误。
- 建立 `文件系统路径` → `模块导出` → `路由配置` 的强类型映射链。
- 为导航组件、路由守卫、布局系统提供统一的类型契约，支撑中大型应用的路由治理。

---

## 🔍 核心类型与接口详解

### 1. `Register` (Interface) - 第 6 行

**说明**  
路由注册的核心契约接口。定义了单个路由条目在注册时必须遵循的数据结构，是路由配置的类型基座。

**推断结构**

```typescript
interface Register {
  path: string; // 路由路径（支持动态参数如 /users/:id）
  component?: ComponentType; // 路由渲染组件
  loader?: () => Promise<unknown>; // 数据预取函数（SSR/CSR 通用）
  meta?: Record<string, unknown>; // 扩展元数据（权限、标题、布局等）
  children?: Register[]; // 嵌套路由配置
  // 可能包含：redirect, beforeEnter, errorComponent 等字段
}
```

**参数/字段解释**
| 字段 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 路由匹配路径，支持静态、动态及通配符语法 |
| `component` | `ComponentType` | 路由激活时渲染的 UI 组件 |
| `loader` | `() => Promise<T>` | 路由加载前执行的数据获取函数，支持并发与缓存 |
| `meta` | `Record<string, unknown>` | 路由元数据，常用于权限标识、页面标题、SEO 配置 |
| `children` | `Register[]` | 子路由数组，支持无限层级嵌套 |

**业务意图推断**  
统一路由配置规范，使全局中间件（如权限拦截器、布局注入器、性能埋点）能够基于一致的接口进行类型安全的路由处理。避免散落在各组件中的硬编码路由配置。

---

### 2. `Pages` (Type) - 第 13 行

**说明**  
全量页面路由的联合类型集合。通常由 `RouteModules` 或文件系统自动推导生成，代表应用中所有可导航的合法路径。

**推断结构**

```typescript
type Pages = keyof RouteModules | string;
// 或更严格的字面量联合："/home" | "/users" | "/settings" | ...
```

**参数/字段解释**  
无直接参数。该类型为**派生类型**，其值域由路由模块映射表动态生成。

**业务意图推断**  
为 `useNavigate`、`<Link>` 等导航 API 提供类型安全的参数约束。开发者在编写路由跳转时，IDE 可自动提示合法路径，彻底杜绝 `404` 路径拼写错误，提升开发体验与代码健壮性。

---

### 3. `RouteFiles` (Type) - 第 31 行

**说明**  
路由路径与物理文件路径的映射关系类型。用于描述“文件系统即路由”的静态结构。

**推断结构**

```typescript
type RouteFiles = {
  [routePath: string]: string; // 键：路由路径，值：相对文件路径
  // 示例：{ "/users": "./routes/users.tsx", "/users/:id": "./routes/users/[id].tsx" }
};
```

**参数/字段解释**  
| 键 | 值 | 说明 |
|----|----|------|
| `routePath` | `string` | 路由匹配路径（含动态参数） |
| `filePath` | `string` | 对应的源码文件相对路径 |

**业务意图推断**  
实现路由树的**静态分析**与**自动化发现**。在构建阶段或开发服务器中，可通过该类型生成路由表、配置 Code Splitting 边界、实现按需加载策略，降低手动维护路由配置的认知负担。

---

### 4. `RouteModules` (Type) - 第 58 行

**说明**  
路由路径与对应模块导出类型的映射。建立路由与业务模块的强类型绑定。

**推断结构**

```typescript
type RouteModules = {
  [routePath: string]: {
    default: ComponentType;
    loader?: () => Promise<unknown>;
    meta?: Record<string, unknown>;
    // 其他框架约定的导出（如 action, head, beforeLoad 等）
  };
};
```

**参数/字段解释**  
| 键 | 值结构 | 说明 |
|----|--------|------|
| `routePath` | `string` | 路由路径 |
| `default` | `ComponentType` | 模块默认导出的路由组件 |
| `loader` | `() => Promise<T>` | 模块导出的数据加载函数 |
| `meta` | `Record<string, unknown>` | 模块导出的静态元数据 |

**业务意图推断**  
确保每个路由文件必须导出符合框架规范的模块结构。在编译期即可检测“缺失组件导出”、“loader 类型不匹配”等架构违规问题，防止因模块结构不一致导致的运行时白屏或数据加载失败。

---

## 🏗️ 架构设计与数据流推断

该文件采用 **类型推导链（Type Derivation Chain）** 设计，数据流向如下：

```mermaid
graph LR
  A[RouteFiles] -->|映射文件路径| B[RouteModules]
  B -->|提取模块导出| C[Pages]
  C -->|生成合法路径集合| D[Register]
  D -->|契约约束| E[全局路由注册/导航API]
```

**架构优势：**

1. **零运行时开销**：路由表在编译期生成，运行时仅保留轻量级匹配逻辑。
2. **强类型闭环**：从文件结构 → 模块导出 → 路由配置 → 导航调用，全链路类型安全。
3. **可扩展性**：通过 `meta` 与 `loader` 预留扩展点，便于接入权限系统、SSR 数据流、性能监控等横切关注点。

---

## 💡 架构师建议与最佳实践

| 场景           | 建议                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **类型维护**   | 避免手动修改 `Pages` / `RouteModules`，应通过框架 CLI 或 `tsup`/`vite-plugin` 自动生成，确保与文件系统同步。 |
| **元数据治理** | 为 `Register.meta` 定义独立接口（如 `RouteMeta`），避免类型膨胀，便于类型守卫（Type Guard）校验。            |
| **权限控制**   | 结合 `loader` 与 `meta.auth` 实现路由级权限拦截，利用 TypeScript 泛型约束未授权路径的导航调用。              |
| **性能优化**   | 基于 `RouteFiles` 映射配置动态 `import()` 边界，实现路由级 Code Splitting，降低首屏体积。                    |
| **调试与监控** | 在开发环境暴露 `RouteModules` 类型树，配合路由调试面板可视化路由加载状态与 loader 耗时。                     |

> 📌 **注**：以上类型签名基于现代 TypeScript 路由架构惯例推断。实际字段与约束请以项目源码为准。若需生成精确的类型声明或配套的路由守卫中间件，可提供完整源码片段进行深度分析。
