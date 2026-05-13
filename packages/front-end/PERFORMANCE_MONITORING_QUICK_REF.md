# Performance Monitoring Quick Reference

## 🚀 Quick Start

### 1. API Call Tracking (Automatic)

All API calls using `trackedFetch` are automatically tracked:

```typescript
import { analyticsInstance } from "~/core/instance";

// Replace fetch with trackedFetch
const response = await analyticsInstance.trackedFetch("/api/data", {
  method: "GET",
  headers: { "Content-Type": "application/json" },
});
```

**Already Integrated:**

- ✅ `sendChatMessage()` in `api.ts`
- ✅ `getWebVitalsStats()` in `api.ts`

### 2. Route Performance Tracking (Automatic)

Already integrated in `root.tsx` - no action needed!

```typescript
export default function App() {
  useRoutePerformance(); // Automatically tracks all routes
  return <Outlet />;
}
```

### 3. View Performance Data

Navigate to `/analytics` to see:

- Web Vitals (LCP, FCP, CLS, TTFB)
- API Performance Charts
- Route Performance Charts
- Performance Trends Over Time

---

## 📊 What's Tracked

### API Calls

- **URL**: Endpoint path
- **Method**: GET, POST, PUT, DELETE, etc.
- **Duration**: Response time in milliseconds
- **Status**: HTTP status code (200, 404, 500, etc.)
- **Success**: Boolean (status 200-299 = true)
- **Timestamp**: When the call was made

### Routes

- **Route**: Path name (e.g., `/analytics`)
- **Load Time**: Complete page load time (ms)
- **DOM Content Loaded**: DOM ready time (ms)
- **First Paint**: First visual render (ms)
- **Navigation Type**: navigate, reload, back_forward

---

## 🔍 Getting Statistics

### API Performance Stats

```typescript
import { analyticsInstance } from "~/core/instance";

const stats = analyticsInstance.getApiCallStats();
console.log(stats);
/*
{
  totalCalls: 150,
  avgDuration: 245.5,
  successRate: 98.7,
  slowestEndpoint: '/api/v1/heavy-query'
}
*/
```

### Route Performance Stats

```typescript
const routeStats = analyticsInstance.getRoutePerformanceStats();
console.log(routeStats);
/*
[
  {
    route: '/analytics',
    avgLoadTime: 1250,
    avgDomContentLoaded: 800,
    visitCount: 45
  },
  {
    route: '/chat',
    avgLoadTime: 950,
    avgDomContentLoaded: 600,
    visitCount: 120
  }
]
*/
```

---

## 🎯 Dashboard Features

### 1. Summary Cards

- Total Records
- Average LCP / FCP / CLS / TTFB
- Real-time metrics

### 2. Timeline Chart

- Performance trends over time
- Filter by: Last 24h, 7 days, 14 days, 30 days
- Shows LCP, FCP, CLS, TTFB trends

### 3. Distribution Charts

- LCP Distribution (Good/Needs Improvement/Poor)
- FCP Distribution
- CLS Distribution
- TTFB Distribution

### 4. API Performance Chart

- Top 10 API endpoints by duration
- Bar chart: Average response time
- Line chart: Success rate percentage
- Dual Y-axis for easy comparison

### 5. Route Performance Chart

- All visited routes
- Grouped bars: Load Time vs DOM Ready
- Identify slow-loading pages

---

## ⚙️ Configuration

### Batch Reporting Settings

In `AnalyticsSDK.ts`:

```typescript
private maxQueueSize = 10;        // Event queue size
private flushInterval = 5000;     // Auto-flush every 5s
private apiMetricsBatchSize = 5;  // API batch threshold
private maxRetries = 5;           // Max retry attempts
```

### Rating Thresholds

**LCP (Largest Contentful Paint):**

- Good: ≤ 2500ms
- Needs Improvement: 2500-4000ms
- Poor: > 4000ms

**FCP (First Contentful Paint):**

- Good: ≤ 1800ms
- Needs Improvement: 1800-3000ms
- Poor: > 3000ms

**CLS (Cumulative Layout Shift):**

- Good: ≤ 0.1
- Needs Improvement: 0.1-0.25
- Poor: > 0.25

**TTFB (Time to First Byte):**

- Good: ≤ 800ms
- Needs Improvement: 800-1800ms
- Poor: > 1800ms

---

## 🛠️ Manual Tracking

### Track Custom API Calls

```typescript
// Manual API tracking (if not using trackedFetch)
const startTime = performance.now();

try {
  const response = await fetch("/api/custom");
  const duration = performance.now() - startTime;

  analyticsInstance.trackApiCall(
    "/api/custom",
    "GET",
    duration,
    response.status,
    response.ok,
  );
} catch (error) {
  const duration = performance.now() - startTime;
  analyticsInstance.trackApiCall("/api/custom", "GET", duration, 0, false);
}
```

### Track Custom Routes

```typescript
// Manual route tracking (if needed)
analyticsInstance.trackRoutePerformance("/custom-route");
```

---

## 🐛 Troubleshooting

### Issue: API calls not being tracked

**Check:**

1. Are you using `trackedFetch` instead of `fetch`?
2. Is `analyticsInstance` imported correctly?
3. Check browser console for errors

**Fix:**

```typescript
// ❌ Wrong
const response = await fetch("/api/data");

// ✅ Correct
import { analyticsInstance } from "~/core/instance";
const response = await analyticsInstance.trackedFetch("/api/data");
```

### Issue: Route performance data missing

**Check:**

1. Is `useRoutePerformance` hook in `App` component?
2. Is browser supporting Performance API?
3. Check if `location.pathname` is correct

**Fix:**

```typescript
// In root.tsx
import { useRoutePerformance } from "./hooks/useRoutePerformance";

export default function App() {
  useRoutePerformance(); // Make sure this is present
  return <Outlet />;
}
```

### Issue: Charts not displaying

**Check:**

1. Is data being saved to PostgreSQL?
2. Are there any TypeScript errors?
3. Is ECharts initialized correctly?

**Debug:**

```typescript
// Check if data exists
console.log("Data:", data);
console.log(
  "API Calls:",
  data.filter((d) => d.metrics.apiCalls),
);
console.log(
  "Routes:",
  data.filter((d) => d.metrics.routePerformance),
);
```

---

## 📈 Best Practices

### 1. Performance Optimization

- ✅ Batch reporting reduces network overhead
- ✅ Automatic tracking has minimal overhead (<1ms)
- ✅ Use `requestIdleCallback` for non-critical tracking

### 2. Data Accuracy

- ✅ Distinguish SPA navigation vs full page loads
- ✅ Record `navigationType` for better analysis
- ✅ Filter out browser prefetch requests

### 3. Privacy Protection

- ✅ URL parameters are sanitized
- ✅ Request bodies are NOT recorded
- ✅ Only performance metrics stored

### 4. Error Handling

- ✅ Failed API calls are tracked (status=0, success=false)
- ✅ Tracking failures don't break main functionality
- ✅ Graceful degradation if Performance API unavailable

---

## 🔗 Related Files

- **Core SDK**: `packages/front-end/app/core/AnalyticsSDK.ts`
- **API Service**: `packages/front-end/app/services/api.ts`
- **Route Hook**: `packages/front-end/app/hooks/useRoutePerformance.ts`
- **Dashboard**: `packages/front-end/app/routes/analytics.tsx`
- **Backend Entity**: `packages/back-end/src/analysis/entities/web-vitals.entity.ts`

---

## 📚 Additional Resources

- [Full Implementation Guide](./PERFORMANCE_MONITORING_IMPLEMENTATION.md)
- [Web Vitals Documentation](https://web.dev/vitals/)
- [Performance API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [ECharts Documentation](https://echarts.apache.org/)

---

## 💡 Tips

1. **Monitor Slow APIs**: Check the API Performance chart weekly to identify bottlenecks
2. **Track Improvements**: Compare before/after metrics when optimizing code
3. **Set Baselines**: Establish performance budgets for critical routes
4. **Alert on Regressions**: Set up monitoring for sudden performance drops
5. **Use Real Data**: Base optimization decisions on actual user metrics, not synthetic tests

---

**Need Help?** Check the full implementation documentation or contact the development team.
