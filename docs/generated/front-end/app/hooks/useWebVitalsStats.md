# `useWebVitalsStats.ts` 技术文档

> 📌 **说明**：由于提供的代码结构数据仅包含单一函数声明，本文档基于 `useWebVitalsStats` 的命名规范、React Hook 设计模式及 Google `web-vitals` 生态标准，进行架构级推断与标准化文档生成。实际开发中请以完整源码为准。

---

## 1. 文件概述

`useWebVitalsStats.ts` 是一个 **React 自定义 Hook**，主要用于在客户端自动采集、聚合并上报 Core Web Vitals（核心网页性能指标）。该模块通常作为前端性能监控体系的基础设施，与埋点 SDK、日志上报服务或 APM 平台对接。

**架构定位**：

- **职责边界**：仅负责指标订阅、数据格式化与上报触发，不包含业务逻辑。
- **生命周期**：遵循 React 组件挂载/卸载周期，自动管理订阅句柄与内存释放。
- **技术栈依赖**：通常依赖 `web-vitals` 库、`navigator.sendBeacon` 或自定义 `fetch` 上报通道。

---

## 2. 核心 API 说明

### 2.1 `useWebVitalsStats`

| 属性         | 说明                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| **类型**     | `Function / React Hook`                                                          |
| **所在行**   | `6`                                                                              |
| **签名推断** | `function useWebVitalsStats(options?: WebVitalsOptions): void \| WebVitalsState` |

#### 🔹 功能描述

在组件挂载时自动初始化 Web Vitals 指标监听器，持续收集 `FCP`、`LCP`、`CLS`、`INP`、`TTFB` 等核心性能数据，并按配置策略进行上报。组件卸载时自动清理订阅，防止内存泄漏。

#### 🔹 参数说明（基于行业标准推断）

| 参数名               | 类型                       | 必填 | 说明                                           |
| -------------------- | -------------------------- | ---- | ---------------------------------------------- |
| `options`            | `WebVitalsOptions`         | 否   | 配置项对象，控制采集范围、上报地址、回调函数等 |
| `options.reportUrl`  | `string`                   | 否   | 指标上报的 HTTP 端点地址                       |
| `options.onReport`   | `(metric: Metric) => void` | 否   | 自定义上报回调，支持拦截、过滤或异步处理       |
| `options.includeCLS` | `boolean`                  | 否   | 是否采集累积布局偏移（默认 `true`）            |
| `options.includeLCP` | `boolean`                  | 否   | 是否采集最大内容绘制（默认 `true`）            |
| `options.includeINP` | `boolean`                  | 否   | 是否采集交互到下一次绘制（默认 `true`）        |

#### 🔹 返回值说明（推断）

- 若为 **Fire-and-Forget 模式**：返回 `void`，仅执行副作用。
- 若为 **状态驱动模式**：返回 `WebVitalsState` 对象，包含当前已采集的指标快照，供 UI 调试或实时展示使用。

#### 🔹 业务意图与架构定位

- **用户体验量化**：将主观的“页面卡顿/加载慢”转化为可追踪的客观指标。
- **性能基线管理**：为 CI/CD 流水线提供性能回归检测数据源。
- **监控闭环**：与错误监控、业务埋点结合，构建完整的可观测性（Observability）体系。

---

## 3. 推断的辅助类型与接口（基于标准实践）

> 注：以下类型未在原结构中出现，但为支撑 `useWebVitalsStats` 的类型安全与扩展性，架构设计中通常会配套定义。

```typescript
/** 指标上报配置 */
interface WebVitalsOptions {
  reportUrl?: string;
  onReport?: (metric: Metric) => void | Promise<void>;
  includeCLS?: boolean;
  includeLCP?: boolean;
  includeINP?: boolean;
  includeFCP?: boolean;
  includeTTFB?: boolean;
  maxReportSize?: number; // 批量上报阈值
}

/** 指标状态快照（可选返回） */
interface WebVitalsState {
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;
  isReady: boolean;
}

/** 兼容 web-vitals 库的 Metric 类型 */
type Metric = {
  name: "FCP" | "LCP" | "CLS" | "INP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  entries: PerformanceEntry[];
  id: string;
};
```

---

## 4. 典型使用示例

```tsx
import { useWebVitalsStats } from "./useWebVitalsStats";

export function App() {
  // 基础用法：自动采集并上报至默认端点
  useWebVitalsStats({
    reportUrl: "/api/performance/vitals",
    onReport: async (metric) => {
      // 可在此处添加业务过滤、数据脱敏或自定义路由
      console.log(
        `[Vitals] ${metric.name}: ${metric.value} (${metric.rating})`,
      );
    },
  });

  return <div>业务组件内容...</div>;
}
```

---

## 5. 架构师建议与注意事项

| 维度                 | 建议                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| **内存管理**         | 必须使用 `useEffect` 清理 `observe` 订阅器，避免 SPA 路由切换时产生幽灵监听。                                  |
| **上报策略**         | 优先使用 `navigator.sendBeacon` 保证页面卸载时数据不丢失；大流量场景建议启用批量聚合（Batching）降低请求频次。 |
| **SSR/Next.js 兼容** | 需在服务端渲染时跳过 Hook 执行（`typeof window === 'undefined'` 守卫），或采用 `next/dynamic` 动态导入。       |
| **类型安全**         | 建议将 `web-vitals` 的 `Metric` 类型通过 `satisfies` 或泛型约束对齐，避免运行时类型漂移。                      |
| **可观测性扩展**     | 可预留 `tags` 或 `context` 参数，支持注入用户角色、页面路径、实验分组等维度，便于后续多维分析。                |

---

📎 **文档版本**：`v1.0.0`  
🛠 **维护建议**：若后续引入指标聚合、降级策略或自定义上报通道，建议拆分为 `useWebVitalsCollector`（采集层）与 `useWebVitalsReporter`（上报层），符合单一职责原则。
