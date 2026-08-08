# 📊 `DistributionChart.tsx` 技术文档

## 📖 文件概述

`DistributionChart.tsx` 是一个基于 React + TypeScript 的**数据分布可视化组件**。从文件结构推断，该组件采用函数式组件架构，通过 `DistributionChartProps` 接口严格约束入参类型，实现数据与视图的解耦。组件内部大概率封装了底层图表库（如 ECharts、Recharts、AntV 或自定义 SVG/Canvas），对外提供声明式 API，适用于用户画像分布、订单状态占比、资源分配比例等中后台数据展示场景。

---

## 🧩 核心结构说明

### 1. `DistributionChartProps` 接口

| 属性                       | 说明                 | 推断类型                               | 业务意图                                           |
| -------------------------- | -------------------- | -------------------------------------- | -------------------------------------------------- |
| `data`                     | 图表渲染的核心数据源 | `Array<T>` 或 `Record<string, number>` | 接收业务层处理后的分布数据，支持动态更新与批量渲染 |
| `title`                    | 图表标题             | `string`                               | 提供上下文语义，增强数据可读性                     |
| `colors` / `colorScheme`   | 颜色映射配置         | `string[]` 或 `ThemeColor`             | 支持品牌色定制与多主题适配，避免硬编码             |
| `onItemClick` / `onSelect` | 交互回调             | `(item: T, index: number) => void`     | 实现下钻分析、详情弹窗或路由跳转等交互链路         |
| `loading`                  | 加载状态控制         | `boolean`                              | 统一处理异步数据请求期间的 UI 占位与防抖           |
| `emptyText`                | 空数据提示文案       | `string`                               | 提升用户体验，明确数据缺失原因                     |
| `width` / `height`         | 容器尺寸             | `number` 或 `string`                   | 支持响应式布局与固定尺寸双模式                     |
| `options` / `config`       | 底层图表配置透传     | `Partial<ChartOptions>`                | 保留扩展性，允许高级用户覆盖默认渲染策略           |

> 💡 **设计意图**：通过接口契约实现**类型安全**与**配置标准化**，降低组件接入成本，同时为后续支持国际化、无障碍访问（a11y）和单元测试预留扩展点。

---

### 2. `DistributionChart` 组件函数

```tsx
function DistributionChart(props: DistributionChartProps): React.ReactElement;
```

| 维度         | 说明                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **函数签名** | 接收 `DistributionChartProps` 类型参数，返回 React 元素树                                                                                                                 |
| **核心职责** | 1. 数据校验与格式化（空值过滤、比例计算、排序）<br>2. 图表实例初始化与生命周期管理<br>3. 响应式尺寸监听与重绘优化<br>4. 状态分支渲染（Loading / Error / Empty / Success） |
| **参数解释** | `props`：包含数据源、样式配置、交互回调及状态标识的完整上下文对象                                                                                                         |
| **业务意图** | 将复杂的图表渲染逻辑封装为**高内聚、低耦合**的 UI 原子组件，屏蔽底层图表库差异，提供一致的开发者体验与运行时性能保障                                                      |

---

## 🏗️ 架构设计与最佳实践推断

| 架构维度     | 推断实现策略                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **性能优化** | 大概率使用 `React.memo` 包裹组件，结合 `useMemo` 缓存格式化后的数据，避免不必要的重渲染                |
| **状态管理** | 采用受控组件模式，状态由父级通过 Props 注入，符合 React 单向数据流规范                                 |
| **类型安全** | 使用泛型约束 `data` 结构（如 `DistributionChartProps<T>`），支持强类型数据下钻                         |
| **可测试性** | 纯函数式结构便于编写 Jest + React Testing Library 单元测试，覆盖边界条件（空数据、超长标签、极端比例） |
| **可访问性** | 推断会注入 `role="img"`、`aria-label` 及键盘导航支持，符合 WCAG 2.1 标准                               |

---

## 💡 典型使用示例（推断）

```tsx
import { DistributionChart } from "./DistributionChart";

const orderStatusData = [
  { label: "已完成", value: 65 },
  { label: "处理中", value: 20 },
  { label: "已取消", value: 15 },
];

<DistributionChart
  title="订单状态分布"
  data={orderStatusData}
  colors={["#1677ff", "#faad14", "#ff4d4f"]}
  onItemClick={(item) => console.log("下钻:", item.label)}
  loading={false}
  emptyText="暂无订单数据"
  width="100%"
  height={300}
/>;
```

---

## ⚠️ 说明与假设

1. 本文档基于提供的结构元数据（接口名、函数名、行号）及 React/TypeScript 工程规范进行**合理推断**。
2. 具体属性字段、泛型约束及底层图表库选型需以实际源码为准。
3. 若组件内部包含自定义 Hook（如 `useChartResize`、`useDataFormatter`）或子组件拆分，建议在后续文档中补充模块依赖图。

> 📌 **架构师建议**：若该组件将在多业务线复用，建议将 `DistributionChartProps` 拆分为基础配置型接口与业务扩展型接口，并通过泛型或组合模式提升类型推导精度与运行时灵活性。
