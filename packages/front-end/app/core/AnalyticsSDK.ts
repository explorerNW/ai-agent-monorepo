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

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.init();
  }

  // 初始化：启动定时器和页面卸载监听
  private init() {
    this.startTimer();
    this.initPerformanceMonitoring();
    // 页面关闭前强制发送剩余数据 (使用 sendBeacon 保证成功率)
    window.addEventListener("beforeunload", () => this.flush(true));
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
        };

        this.performanceMetrics.set("LCP", metric);
        // 不立即上报，等待汇总

        observer.disconnect();
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });
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
        };

        this.performanceMetrics.set("FCP", metric);
        // 不立即上报，等待汇总

        observer.disconnect();
      });

      observer.observe({ type: "paint", buffered: true });
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
        };

        this.performanceMetrics.set("CLS", metric);
        // 不立即上报，等待汇总
      });

      observer.observe({ type: "layout-shift", buffered: true });

      // 页面隐藏时报告最终 CLS 值并触发汇总上报
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          const finalMetric: PerformanceMetric = {
            name: "CLS",
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            navigationType: this.getNavigationType(),
          };
          this.performanceMetrics.set("CLS", finalMetric);
          this.flushPerformanceMetrics(); // 触发汇总上报
          observer.disconnect();
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
        };

        this.performanceMetrics.set("FID", metric);
        // 不立即上报，等待汇总

        observer.disconnect();
      });

      observer.observe({ type: "first-input", buffered: true });
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
        // 不立即上报，等待汇总

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

  // 核心上报方法
  public track(eventName: string, properties: Record<string, any> = {}) {
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

    if (isSync && navigator.sendBeacon && eventsToSend.length > 0) {
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

    const metricsData: Record<string, any> = {};
    this.performanceMetrics.forEach((metric, name) => {
      metricsData[name.toLowerCase()] = {
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
      };
    });

    // 将所有性能指标合并为一条事件上报
    this.track("web_vitals_summary", {
      metrics: metricsData,
      timestamp: Date.now(),
      url: window.location.href,
    });

    // 清空已上报的指标（可选，根据需求决定是否保留历史数据）
    // this.performanceMetrics.clear();
  }
}
