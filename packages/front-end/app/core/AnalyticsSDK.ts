interface EventData {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
  userId: string;
  url: string;
  ua: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
  timestamp?: number; // Add timestamp to track when metric was captured
}

interface ApiCallMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

interface RoutePerformanceMetric {
  route: string;
  fcp: number | null;
  lcp: number | null;
  duration: number;
  timestamp: number;
  navigationType: string;
}

export class AnalyticsSDK {
  private queue: EventData[] = [];
  private maxQueueSize = 10; // 达到10条触发一次上报
  private flushInterval = 5000; // 每5秒强制上报一次
  private timer: any = null;
  private serverUrl: string;
  private retryCount = 0; // 重试计数器
  private maxRetries = 5; // 最大重试次数
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();
  private apiCallMetrics: ApiCallMetric[] = [];
  private routePerformanceMetrics: RoutePerformanceMetric[] = [];
  private apiMetricsBatchSize = 5; // API指标批量上报阈值

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    // Only initialize in browser environment
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      this.init();
    }
  }

  // 初始化：启动定时器和页面卸载监听
  private init() {
    this.startTimer();
    this.initPerformanceMonitoring();
    // 页面关闭前强制发送剩余数据 (使用 sendBeacon 保证成功率)
    window.addEventListener("beforeunload", () => {
      console.debug("[AnalyticsSDK] beforeunload triggered - flushing metrics");
      // Update metrics with fresh values before sending
      this.updateMetricsWithFreshValues();
      this.flush(true);
    });
  }

  // 初始化性能监控
  private initPerformanceMonitoring() {
    // 等待页面完全加载后再初始化 Web Vitals
    if (document.readyState === "complete") {
      this.setupWebVitals();
    } else {
      window.addEventListener("load", () => this.setupWebVitals());
    }
  }

  // 设置 Web Vitals 监控
  private setupWebVitals() {
    // LCP - Largest Contentful Paint
    this.observeLCP();

    // FCP - First Contentful Paint
    this.observeFCP();

    // CLS - Cumulative Layout Shift
    this.observeCLS();

    // FID - First Input Delay
    this.observeFID();

    // TTFB - Time to First Byte
    this.observeTTFB();
  }

  // 观察 LCP
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        const metric: PerformanceMetric = {
          name: "LCP",
          value: lastEntry.startTime,
          rating: this.getLCPRating(lastEntry.startTime),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(), // Track when this metric was captured
        };

        this.performanceMetrics.set("LCP", metric);
        // Don't disconnect - keep observing for updates during SPA navigation

        console.debug("[AnalyticsSDK] LCP updated:", lastEntry.startTime);
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });

      // Store observer reference for potential cleanup
      (this as any).lcpObserver = observer;
    } catch (error) {
      console.warn("LCP observer not supported:", error);
    }
  }

  // 观察 FCP
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];

        const metric: PerformanceMetric = {
          name: "FCP",
          value: firstEntry.startTime,
          rating: this.getFCPRating(firstEntry.startTime),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(), // Track when this metric was captured
        };

        this.performanceMetrics.set("FCP", metric);
        // Don't disconnect - keep observing for updates

        console.debug("[AnalyticsSDK] FCP updated:", firstEntry.startTime);
      });

      observer.observe({ type: "paint", buffered: true });

      // Store observer reference for potential cleanup
      (this as any).fcpObserver = observer;
    } catch (error) {
      console.warn("FCP observer not supported:", error);
    }
  }

  // 观察 CLS
  private observeCLS() {
    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        const metric: PerformanceMetric = {
          name: "CLS",
          value: clsValue,
          rating: this.getCLSRating(clsValue),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(), // Track when this metric was captured
        };

        this.performanceMetrics.set("CLS", metric);
        // Don't disconnect - keep accumulating CLS throughout page lifecycle
      });

      observer.observe({ type: "layout-shift", buffered: true });

      // Store observer reference
      (this as any).clsObserver = observer;

      // 页面隐藏时报告最终 CLS 值并触发汇总上报
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          const finalMetric: PerformanceMetric = {
            name: "CLS",
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            navigationType: this.getNavigationType(),
            timestamp: Date.now(),
          };
          this.performanceMetrics.set("CLS", finalMetric);
          this.flushPerformanceMetrics(); // 触发汇总上报
          // Don't disconnect - allow continued tracking if page becomes visible again
        }
      });
    } catch (error) {
      console.warn("CLS observer not supported:", error);
    }
  }

  // 观察 FID
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEventTiming;

        const fidValue = firstEntry.processingStart - firstEntry.startTime;
        const metric: PerformanceMetric = {
          name: "FID",
          value: fidValue,
          rating: this.getFIDRating(fidValue),
          navigationType: this.getNavigationType(),
          timestamp: Date.now(), // Track when this metric was captured
        };

        this.performanceMetrics.set("FID", metric);
        // Don't disconnect - keep observing for multiple interactions

        console.debug("[AnalyticsSDK] FID captured:", fidValue);
      });

      observer.observe({ type: "first-input", buffered: true });

      // Store observer reference
      (this as any).fidObserver = observer;
    } catch (error) {
      console.warn("FID observer not supported:", error);
    }
  }

  // 观察 TTFB
  private observeTTFB() {
    try {
      const navigationEntries = performance.getEntriesByType("navigation");
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        const ttfb = navEntry.responseStart - navEntry.requestStart;

        const metric: PerformanceMetric = {
          name: "TTFB",
          value: ttfb,
          rating: this.getTTFBRating(ttfb),
          navigationType: this.getNavigationType(),
        };

        this.performanceMetrics.set("TTFB", metric);
        // Don't disconnect - keep observing for updates

        // TTFB 是最早可获取的指标，延迟一段时间后检查是否可以汇总上报
        setTimeout(() => this.checkAndFlushPerformanceMetrics(), 3000);
      }
    } catch (error) {
      console.warn("TTFB measurement not supported:", error);
    }
  }

  // LCP 评级标准
  private getLCPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }

  // FCP 评级标准
  private getFCPRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 1800) return "good";
    if (value <= 3000) return "needs-improvement";
    return "poor";
  }

  // CLS 评级标准
  private getCLSRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }

  // FID 评级标准
  private getFIDRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 100) return "good";
    if (value <= 300) return "needs-improvement";
    return "poor";
  }

  // TTFB 评级标准
  private getTTFBRating(value: number): "good" | "needs-improvement" | "poor" {
    if (value <= 800) return "good";
    if (value <= 1800) return "needs-improvement";
    return "poor";
  }

  // 获取导航类型
  private getNavigationType(): string {
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
      return navEntry.type || "navigate";
    }
    return "unknown";
  }

  // Get fresh FCP value from Performance API
  private getFreshFCPValue(): number | null {
    try {
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(
        (entry) => entry.name === "first-contentful-paint",
      );
      return fcpEntry ? fcpEntry.startTime : null;
    } catch (error) {
      console.warn("[AnalyticsSDK] Failed to get fresh FCP:", error);
      return null;
    }
  }

  // Get fresh LCP value from Performance API
  private getFreshLCPValue(): number | null {
    try {
      const lcpEntries = performance.getEntriesByType(
        "largest-contentful-paint",
      );
      return lcpEntries.length > 0
        ? lcpEntries[lcpEntries.length - 1].startTime
        : null;
    } catch (error) {
      console.warn("[AnalyticsSDK] Failed to get fresh LCP:", error);
      return null;
    }
  }

  // Update performance metrics with fresh values before reporting
  private updateMetricsWithFreshValues() {
    // Get fresh FCP
    const freshFCP = this.getFreshFCPValue();
    if (freshFCP !== null) {
      const existingMetric = this.performanceMetrics.get("FCP");
      this.performanceMetrics.set("FCP", {
        name: "FCP",
        value: freshFCP,
        rating: this.getFCPRating(freshFCP),
        navigationType: this.getNavigationType(),
        timestamp: Date.now(),
      });

      // Log if value changed significantly
      if (existingMetric && Math.abs(existingMetric.value - freshFCP) > 100) {
        console.debug(
          `[AnalyticsSDK] FCP updated from ${existingMetric.value.toFixed(2)}ms to ${freshFCP.toFixed(2)}ms`,
        );
      }
    }

    // Get fresh LCP
    const freshLCP = this.getFreshLCPValue();
    if (freshLCP !== null) {
      const existingMetric = this.performanceMetrics.get("LCP");
      this.performanceMetrics.set("LCP", {
        name: "LCP",
        value: freshLCP,
        rating: this.getLCPRating(freshLCP),
        navigationType: this.getNavigationType(),
        timestamp: Date.now(),
      });

      // Log if value changed significantly
      if (existingMetric && Math.abs(existingMetric.value - freshLCP) > 100) {
        console.debug(
          `[AnalyticsSDK] LCP updated from ${existingMetric.value.toFixed(2)}ms to ${freshLCP.toFixed(2)}ms`,
        );
      }
    }
  }

  // 核心上报方法
  public track(eventName: string, properties: Record<string, any> = {}) {
    // Only track in browser environment
    if (typeof window === "undefined") {
      return;
    }

    const event: EventData = {
      eventName,
      properties,
      timestamp: Date.now(),
      userId: this.getUserId(), // 获取或生成用户ID
      url: window.location.href,
      ua: navigator.userAgent,
    };

    this.queue.push(event);

    // 如果队列满了，立即上报
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  // 发送数据
  private flush(isSync = false) {
    if (this.queue.length === 0) return;

    // 取出当前队列所有数据
    const eventsToSend = [...this.queue];
    this.queue = []; // 清空队列

    const payload = JSON.stringify({ events: eventsToSend });

    if (isSync && navigator.sendBeacon) {
      // 页面卸载时使用 sendBeacon，异步但可靠
      navigator.sendBeacon(this.serverUrl, payload);
      this.retryCount = 0; // 成功后重置计数器
    } else {
      // 普通场景使用 fetch
      fetch(this.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
        .then(() => {
          // 成功时重置重试计数器
          this.retryCount = 0;
        })
        .catch(() => {
          // 失败重试逻辑：将数据重新放回队列头部
          this.queue.unshift(...eventsToSend);
          this.retryCount++;

          // 重试5次后还不成功就clearInterval
          if (this.retryCount >= this.maxRetries) {
            console.error(
              `Analytics SDK: Failed to send data after ${this.maxRetries} attempts. Stopping retries.`,
            );
            clearInterval(this.timer);
            this.timer = null;
          }
        });
    }
  }

  private startTimer() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  private getUserId(): string {
    let uid = localStorage.getItem("analytics_uid");
    if (!uid) {
      uid = `uid_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("analytics_uid", uid);
    }
    return uid;
  }

  // 获取所有性能指标
  public getPerformanceMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.performanceMetrics);
  }

  // 获取单个性能指标
  public getMetric(name: string): PerformanceMetric | undefined {
    return this.performanceMetrics.get(name);
  }

  // 检查并汇总上报性能指标
  private checkAndFlushPerformanceMetrics() {
    // 当至少收集到 2 个指标时触发上报
    if (this.performanceMetrics.size >= 2) {
      this.flushPerformanceMetrics();
    }
  }

  // 汇总上报所有性能指标
  private flushPerformanceMetrics() {
    if (this.performanceMetrics.size === 0) return;

    // CRITICAL: Update metrics with fresh values before reporting
    // This ensures we report current FCP/LCP values, not stale ones from page load
    this.updateMetricsWithFreshValues();

    const metricsData: Record<string, any> = {};
    this.performanceMetrics.forEach((metric, name) => {
      metricsData[name.toLowerCase()] = {
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
        timestamp: metric.timestamp, // Include when metric was captured
      };
    });

    // Add API call metrics if available
    if (this.apiCallMetrics.length > 0) {
      metricsData.apiCalls = [...this.apiCallMetrics];
    }

    // Add route performance metrics if available
    if (this.routePerformanceMetrics.length > 0) {
      // Use the most recent route performance metric
      const latestRoute =
        this.routePerformanceMetrics[this.routePerformanceMetrics.length - 1];
      metricsData.routePerformance = latestRoute;
    }

    // Log what we're about to send for debugging
    console.debug("[AnalyticsSDK] Flushing performance metrics:", {
      fcp: metricsData.fcp?.value,
      lcp: metricsData.lcp?.value,
      cls: metricsData.cls?.value,
      fid: metricsData.fid?.value,
      ttfb: metricsData.ttfb?.value,
      apiCalls: metricsData.apiCalls?.length || 0,
    });

    // 将所有性能指标合并为一条事件上报
    this.track("web_vitals_summary", {
      metrics: metricsData,
      navigationType: this.getNavigationType(),
      timestamp: Date.now(),
      url: window.location.href,
    });

    // Clear the tracked metrics after reporting
    this.apiCallMetrics = [];
    this.routePerformanceMetrics = [];
  }

  // 跟踪 API 调用性能
  public trackApiCall(
    url: string,
    method: string,
    duration: number,
    status: number,
    success: boolean,
  ) {
    const apiMetric: ApiCallMetric = {
      url,
      method,
      duration,
      status,
      timestamp: Date.now(),
      success,
    };

    this.apiCallMetrics.push(apiMetric);

    // 达到批量阈值时上报
    if (this.apiCallMetrics.length >= this.apiMetricsBatchSize) {
      this.flushApiMetrics();
    }
  }

  // 批量上报 API 调用指标
  private flushApiMetrics() {
    if (this.apiCallMetrics.length === 0) return;

    // Don't send separate event, just keep accumulating
    // The metrics will be included in the next web_vitals_summary event

    // Log for debugging
    console.log(
      `[AnalyticsSDK] Accumulated ${this.apiCallMetrics.length} API call metrics`,
    );
  }

  // 包装 fetch 请求以自动追踪性能
  public trackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Only track in browser environment
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return fetch(input, init);
    }

    // Sanitize URL to avoid tracking sensitive query parameters
    const sanitizeUrl = (urlString: string) => {
      try {
        const url = new URL(urlString, window.location.origin);
        url.search = ""; // 移除所有查询参数
        // 或者只保留白名单参数，如 ?page=1
        return url.toString();
      } catch {
        return urlString;
      }
    };

    const startTime = performance.now();
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method || "GET";

    return fetch(input, init)
      .then((response) => {
        const duration = performance.now() - startTime;
        this.trackApiCall(
          sanitizeUrl(url),
          method,
          duration,
          response.status,
          response.ok,
        );
        return response;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        this.trackApiCall(sanitizeUrl(url), method, duration, 0, false);
        throw error;
      });
  }

  // Track route change start time for SPA navigation
  private routeChangeStartTime: number | null = null;

  // Mark the start of a route change (call before navigation)
  public markRouteChangeStart(routeName?: string) {
    if (typeof performance !== "undefined") {
      this.routeChangeStartTime = performance.now();

      // Create a performance mark for accurate measurement
      try {
        const route =
          routeName ||
          (typeof window !== "undefined"
            ? window.location.pathname
            : "unknown");
        performance.mark(`route-change-start-${route}`);
      } catch (e) {
        // Clear existing mark if it exists, then create new one
        try {
          const route =
            routeName ||
            (typeof window !== "undefined"
              ? window.location.pathname
              : "unknown");
          performance.clearMarks(`route-change-start-${route}`);
          performance.mark(`route-change-start-${route}`);
        } catch (clearError) {
          console.debug("[AnalyticsSDK] Mark creation error:", clearError);
        }
      }
    }
  }

  // Track route performance with FCP and LCP metrics
  public trackRoutePerformanceWithMetrics(
    route: string,
    metrics: {
      fcp: number | null;
      lcp: number | null;
      startTime: number;
      endTime: number;
    },
  ) {
    // Only track in browser environment
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return;
    }

    // Check if this is initial page load vs SPA route change
    const navigationEntries = performance.getEntriesByType("navigation");
    const isInitialLoad =
      navigationEntries.length > 0 &&
      !this.routeChangeStartTime &&
      metrics.startTime === 0;

    const navigationType = isInitialLoad
      ? (navigationEntries[0] as PerformanceNavigationTiming).type || "navigate"
      : "spa_navigate";

    const routeMetrics = {
      route,
      fcp: metrics.fcp,
      lcp: metrics.lcp,
      duration: metrics.endTime - metrics.startTime,
      navigationType,
      timestamp: new Date().toISOString(),
    };

    // Send immediate event with FCP and LCP metrics
    this.track("web_vitals_summary", {
      metrics: {
        routePerformance: routeMetrics,
        apiCalls: [...this.apiCallMetrics],
      },
    });

    // Clear sent API calls
    this.apiCallMetrics = [];
    this.routePerformanceMetrics = [];

    console.log(
      `[AnalyticsSDK] Route performance (${isInitialLoad ? "initial" : "SPA"}): ${route}`,
      routeMetrics,
    );
  }

  // 获取首次绘制时间
  private getFirstPaintTime(): number {
    const paintEntries = performance.getEntriesByType("paint");
    const fpEntry = paintEntries.find((entry) => entry.name === "first-paint");
    return fpEntry ? fpEntry.startTime : 0;
  }

  // 获取 API 调用统计
  public getApiCallStats(): {
    totalCalls: number;
    avgDuration: number;
    successRate: number;
    slowestEndpoint: string;
  } {
    if (this.apiCallMetrics.length === 0) {
      return {
        totalCalls: 0,
        avgDuration: 0,
        successRate: 0,
        slowestEndpoint: "",
      };
    }

    const totalCalls = this.apiCallMetrics.length;
    const avgDuration =
      this.apiCallMetrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls;
    const successCount = this.apiCallMetrics.filter((m) => m.success).length;
    const successRate = (successCount / totalCalls) * 100;

    // 找出最慢的端点
    const endpointDurations: Record<string, number[]> = {};
    this.apiCallMetrics.forEach((metric) => {
      if (!endpointDurations[metric.url]) {
        endpointDurations[metric.url] = [];
      }
      endpointDurations[metric.url].push(metric.duration);
    });

    let slowestEndpoint = "";
    let maxAvgDuration = 0;
    Object.entries(endpointDurations).forEach(([url, durations]) => {
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      if (avg > maxAvgDuration) {
        maxAvgDuration = avg;
        slowestEndpoint = url;
      }
    });

    return { totalCalls, avgDuration, successRate, slowestEndpoint };
  }

  // 获取路由性能统计
  public getRoutePerformanceStats(): Array<{
    route: string;
    avgFcp: number;
    avgLcp: number;
    visitCount: number;
  }> {
    if (this.routePerformanceMetrics.length === 0) return [];

    const routeStats: Record<
      string,
      { fcpValues: number[]; lcpValues: number[] }
    > = {};

    this.routePerformanceMetrics.forEach((metric) => {
      if (!routeStats[metric.route]) {
        routeStats[metric.route] = { fcpValues: [], lcpValues: [] };
      }
      if (metric.fcp !== null) {
        routeStats[metric.route].fcpValues.push(metric.fcp);
      }
      if (metric.lcp !== null) {
        routeStats[metric.route].lcpValues.push(metric.lcp);
      }
    });

    return Object.entries(routeStats).map(([route, stats]) => ({
      route,
      avgFcp:
        stats.fcpValues.length > 0
          ? stats.fcpValues.reduce((sum, t) => sum + t, 0) /
            stats.fcpValues.length
          : 0,
      avgLcp:
        stats.lcpValues.length > 0
          ? stats.lcpValues.reduce((sum, t) => sum + t, 0) /
            stats.lcpValues.length
          : 0,
      visitCount: Math.max(stats.fcpValues.length, stats.lcpValues.length),
    }));
  }

  // Cleanup method to disconnect all observers (useful for SPA navigation or component unmount)
  public cleanup() {
    console.debug("[AnalyticsSDK] Cleaning up performance observers");

    try {
      (this as any).lcpObserver?.disconnect();
      (this as any).fcpObserver?.disconnect();
      (this as any).clsObserver?.disconnect();
      (this as any).fidObserver?.disconnect();
    } catch (error) {
      console.warn("[AnalyticsSDK] Error during cleanup:", error);
    }

    // Clear the timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Flush any remaining metrics before cleanup
    if (this.performanceMetrics.size > 0 || this.apiCallMetrics.length > 0) {
      this.flushPerformanceMetrics();
    }
  }
}
