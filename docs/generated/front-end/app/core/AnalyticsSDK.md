# AnalyticsSDK 类型结构

## 文件概述

本文件包含 `AnalyticsSDK` 类，它是用于收集和分析性能指标的 TypeScript 框架。它提供了多种性能监控功能，包括页面加载时间（LCP）、首屏呈现时间（FCP）、内容解释率（CLR）等。

### 类概览

- **EventData**: 事件数据接口。
- **PerformanceMetric**: 性能指标接口。
- **ApiCallMetric**: API 调用性能监控接口。
- **RoutePerformanceMetric**: 路由性能监控接口。
- **PerformanceMetrics**: 性能指标集合接口。
- **APIMetrics**: API 性能指标接口。

### 函数概览

- `constructor`: 初始化类。
- `init`: 初始化性能监控功能。
- `initPerformanceMonitoring`: 初始化性能监控。
- `setupWebVitals`: 设置 Web Vital 监控。
- `collectMetrics`: 收集性能指标数据。
- `observeLCP`: 观察 LCP（页面加载时间）。
- `observeFCP`: 观察 FCP（首屏呈现时间）。
- `observeCLS`: 观察 CLS（内容解释率）。
- `observeFID`: 观察 FID（首次输入延迟）。
- `observeTTFB`: 观察 TTFB（首字节延迟）。
- `getLCPRating`: 获取 LCP 评分。
- `getFCPRating`: 获取 FCP 评分。
- `getCLSRating`: 获取 CLS 评分。
- `getFIDRating`: 获取 FID 评分。
- `getTTFBRating`: 获取 TTFB 评分。
- `getNavigationType`: 获取导航类型。
- `getFreshFCPValue`: 获取新鲜的 FCP 值。
- `getFreshLCPValue`: 获取新鲜的 LCP 值。
- `updateMetricsWithFreshValues`: 更新性能指标数据以包含新鲜值。
- `track`: 记录事件。
- `flush`: 强制刷新性能监控数据。
- `startTimer`: 开始计时器。
- `getUserId`: 获取用户 ID。
- `getPerformanceMetrics`: 获取所有性能指标。
- `getMetric`: 获取特定的性能指标。
- `checkAndFlushPerformanceMetrics`: 检查并刷新性能监控数据。
- `flushPerformanceMetrics`: 强制刷新性能监控数据。
- `trackApiCall`: 记录 API 调用事件。
- `flushApiMetrics`: 强制刷新 API 性能监控数据。
- `trackedFetch`: 用于跟踪 fetch 操作的函数。
- `markRouteChangeStart`: 标记路由变化开始事件。
- `trackRoutePerformanceWithMetrics`: 在路由性能中添加指标。
- `getFirstPaintTime`: 获取首屏呈现时间。
- `getApiCallStats`: 获取 API 调用统计信息。
- `getRoutePerformanceStats`: 获取路由性能监控数据。
- `sendToBackend`: 发送数据到后端服务器。
- `cleanup`: 清理和清理资源。

## 代码示例

```typescript
// 示例：收集性能指标
AnalyticsSDK.init();
AnalyticsSDK.collectMetrics();

// 示例：观察 LCP
AnalyticsSDK.observeLCP();

// 示例：获取 FCP 评分
const fcpRating = AnalyticsSDK.getFCPRating();
```

### 性能监控功能

- **页面加载时间 (LCP)**: 使用 `observeLCP` 方法进行观测。
- **首屏呈现时间 (FCP)**: 使用 `observeFCP` 方法进行观测。
- **内容解释率 (CLR)**: 使用 `observeCLS` 方法进行观测。
- **首次输入延迟 (FID)**: 使用 `observeFID` 方法进行观测。
- **首字节延迟 (TTFB)**: 使用 `observeTTFB` 方法进行观测。

### 性能指标数据

- **EventData**: 包含事件的数据结构。
- **PerformanceMetric**: 用于存储和操作性能监控结果的接口。
- **APIMetrics**: 用于存储和操作 API 性能监控结果的接口。

通过这些功能，AnalyticsSDK 类可以帮助开发者更好地理解和优化应用的性能。
