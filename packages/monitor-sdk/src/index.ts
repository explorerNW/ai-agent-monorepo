import { onFCP, onLCP, onCLS, onTTFB, onINP } from "web-vitals";
/**
 * 企业级前端监控 SDK (TypeScript版)
 * 核心特性：代理队列模式、双队列管理、性能与错误自动采集、SPA适配、可靠离页上报
 */

// 1. 定义统一的事件数据结构 (Who, When, Where, What, How)
interface MonitorEvent {
  eventType: "performance" | "error" | "api" | "custom";
  timestamp: number;
  pageUrl: string;
  anonymousId: string; // 设备唯一ID
  userId?: string; // 登录用户ID
  eventData?: {
    url?: string;
    fcp?: number;
    lcp?: number;
    cls?: number;
    fid?: number;
    ttfb?: number;
    inp?: number;
    error?: Error; // 错误对象
    message?: string; // 错误信息
    reason?: string; // 错误原因
    stack?: string; // 错误堆栈
    filename?: string; // 错误文件名
    duration?: string; // 接口耗时
    success?: boolean; // 接口是否成功
    type?: "page_view" | "unhandledrejection";
    path?: string; // 接口路径
  }; // 具体的事件数据
}

// SDK 配置项
interface SDKConfig {
  reportUrl: string;
  appId: string;
  maxQueueSize?: number; // 批量上报的阈值
  flushInterval?: number; // 定时上报的时间(ms)
}

export class EnterpriseMonitorSDK {
  private config: SDKConfig;
  private queue: MonitorEvent[] = []; // 批量上报队列
  private immediateQueue: MonitorEvent[] = []; // 实时上报队列（如报错）
  private anonymousId: string;
  private isInitialized = false;
  private metrics = {
    lcp: 0,
    fcp: 0,
    cls: 0,
    fid: 0,
    ttfb: 0,
    inp: 0,
    userAgent: navigator.userAgent,
    navigationType: "",
  };

  constructor(config: SDKConfig) {
    this.config = {
      maxQueueSize: 20,
      flushInterval: 15000,
      ...config,
    };
    // 生成或获取设备唯一ID
    this.anonymousId = this.getOrCreateAnonymousId();

    // 启动定时上报
    this.startTimer();
    // 绑定离页上报事件
    this.bindPageLeaveEvents();
  }

  // ================= 核心初始化与回捞机制 =================
  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. 自动采集性能指标 (FCP, LCP等)
    this.collectMetrics();
    // this.observePerformance();
    // 2. 自动捕获全局 JS 错误
    this.observeErrors();
    // 3. 劫持 fetch 请求计算接口耗时
    this.hijackFetch();
    // 4. SPA 路由变化监听
    this.observeSPARoute();

    console.log("企业级监控 SDK 初始化完成");
  }

  // 回捞机制：真实SDK加载后，执行代理壳暂存的指令
  public replayQueue(commands: any[]) {
    commands.forEach((cmd) => {
      if (cmd.method === "track") this.track(cmd.data);
      if (cmd.method === "identify") this.identify(cmd.userId);
    });
  }

  // ================= 数据入队与对外 API =================
  // 自定义埋点上报
  public track(eventData: any) {
    const event: MonitorEvent = {
      eventType: "custom",
      timestamp: Date.now(),
      pageUrl: window.location.href,
      anonymousId: this.anonymousId,
      eventData,
    };
    this.enqueue(event, false);
  }

  // 关联登录用户ID
  public identify(userId: string) {
    // 实际逻辑...
  }

  // 将事件推入对应的队列
  private enqueue(event: MonitorEvent, isImmediate: boolean) {
    if (isImmediate) {
      this.immediateQueue.push(event);
      this.flush(true); // 实时队列直接触发上报
    } else {
      this.queue.push(event);
      // 达到阈值自动触发批量上报
      if (this.queue.length >= (this.config.maxQueueSize || 20)) {
        this.flush(false);
      }
    }
  }

  // 自动采集性能指标
  private collectMetrics() {
    // 收集 FCP
    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.checkMetrics();
    });
    // 收集 LCP
    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.checkMetrics();
    });
    // 收集 CLS
    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.checkMetrics();
    });
    // 收集 TTFB
    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.checkMetrics();
    });
    // 收集 INP (如果浏览器支持)
    if ("PerformanceEventTiming" in window) {
      onINP((metric) => {
        this.metrics.inp = metric.value;
        this.checkMetrics();
      });
    }
  }

  // 检查指标是否都采集完毕，如果是则上报性能指标
  private checkMetrics() {
    if (this.metrics.fcp > 0 && this.metrics.lcp > 0) {
      this.enqueue(
        {
          eventType: "performance",
          anonymousId: this.anonymousId,
          pageUrl: window.location.href,
          timestamp: Date.now(),
          eventData: {
            ...this.metrics,
          },
        },
        true,
      );
    }
  }

  // ================= 自动采集核心逻辑 =================
  // 1. 性能指标监听 (PerformanceObserver)
  private observePerformance() {
    if (!window.PerformanceObserver) return;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const metric = {
        lcp: 0,
        fcp: 0,
        cls: 0,
        fid: 0,
        ttfb: 0,
        userAgent: navigator.userAgent,
        navigationType: "",
      };
      const firstEntry = entries[0] as PerformanceEventTiming;

      const fidValue = firstEntry.processingStart - firstEntry.startTime;
      metric.fid = fidValue;

      const navigationEntries = performance.getEntriesByType("navigation");
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        metric.navigationType = navEntry.type;
        metric.ttfb = navEntry.responseStart - navEntry.connectStart;
      }

      entries.forEach((entry) => {
        // 采集 LCP
        if (entry.entryType === "largest-contentful-paint") {
          metric.lcp = entry.startTime;
        }
        // 采集 FCP
        if (entry.entryType === "first-contentful-paint") {
          metric.fcp = entry.startTime;
        }
        // 采集 CLS
        if (entry.entryType === "layout-shift") {
          metric.cls = entry.startTime;
        }

        metric.fid =
          (entry as PerformanceEventTiming).processingStart - entry.startTime;

        this.enqueue(
          {
            eventType: "performance",
            anonymousId: this.anonymousId,
            pageUrl: window.location.href,
            timestamp: Date.now(),
            eventData: {
              ...metric,
            },
          },
          false,
        );
      });
    });
    observer.observe({
      entryTypes: [
        "pant",
        "first-contentful-paint",
        "largest-contentful-paint",
        "layout-shift",
      ],
    });
  }

  // 2. 全局错误监听
  private observeErrors() {
    window.addEventListener("error", (e) => {
      this.enqueue(
        {
          eventType: "error",
          timestamp: Date.now(),
          pageUrl: window.location.href,
          anonymousId: this.anonymousId,
          eventData: {
            message: e.message,
            stack: e.error?.stack,
            filename: e.filename,
          },
        },
        true,
      ); // 错误属于关键事件，走实时上报
    });

    window.addEventListener("unhandledrejection", (e) => {
      this.enqueue(
        {
          eventType: "error",
          timestamp: Date.now(),
          pageUrl: window.location.href,
          anonymousId: this.anonymousId,
          eventData: { reason: e.reason, type: "unhandledrejection" },
        },
        true,
      );
    });
  }

  // 3. 劫持 Fetch 计算接口耗时
  private hijackFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        this.reportApiPerformance(args[0], startTime, true);
        return response;
      } catch (error) {
        this.reportApiPerformance(args[0], startTime, false, error);
        throw error;
      }
    };
  }

  private reportApiPerformance(
    url: any,
    startTime: number,
    success: boolean,
    error?: any,
  ) {
    const duration = performance.now() - startTime;
    this.enqueue(
      {
        eventType: "api",
        timestamp: Date.now(),
        pageUrl: window.location.href,
        anonymousId: this.anonymousId,
        eventData: {
          url,
          duration: duration.toFixed(2),
          success,
          error: error?.message,
        },
      },
      false,
    );
  }

  // 4. SPA 路由监听
  private observeSPARoute() {
    const reportPageView = () => {
      this.enqueue(
        {
          eventType: "custom",
          timestamp: Date.now(),
          pageUrl: window.location.href,
          anonymousId: this.anonymousId,
          eventData: { type: "page_view", path: window.location.pathname },
        },
        false,
      );
    };

    window.addEventListener("hashchange", reportPageView);
    window.addEventListener("popstate", reportPageView);
    // 兼容 history.pushState / replaceState
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      reportPageView();
    };
  }

  // ================= 离页上报与降级策略 =================
  private bindPageLeaveEvents() {
    // 推荐使用 visibilitychange，兼容性比 beforeunload 更好
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush(true); // 页面隐藏时，强制上报所有剩余数据
      }
    });
  }

  private flush(isPageLeave = false) {
    const eventsToSend = isPageLeave
      ? [...this.queue, ...this.immediateQueue]
      : [...this.immediateQueue];

    if (eventsToSend.length === 0 && !isPageLeave) return;

    // 清空队列
    this.queue = [];
    this.immediateQueue = [];

    // 封装成 Blob 确保 sendBeacon 的 MIME 类型正确
    const blob = new Blob([JSON.stringify(eventsToSend)], {
      type: "application/json",
    });

    // 优先使用 sendBeacon，失败则降级为 keepalive fetch
    const success = navigator.sendBeacon(this.config.reportUrl, blob);
    if (!success) {
      fetch(this.config.reportUrl, {
        method: "POST",
        body: blob,
        keepalive: true, // 允许页面卸载后继续发送
      }).catch(() => {
        // 极端情况下的兜底：存入 localStorage 或 IndexedDB，等页面恢复时再补报
        this.saveToLocalStorage(eventsToSend);
      });
    }
  }

  private startTimer() {
    setInterval(() => this.flush(false), this.config.flushInterval);
  }

  private getOrCreateAnonymousId() {
    let id = localStorage.getItem("monitor_anonymous_id");
    if (!id) {
      id = "anon_" + Math.random().toString(36).substring(2);
      localStorage.setItem("monitor_anonymous_id", id);
    }
    return id;
  }

  private saveToLocalStorage(events: MonitorEvent[]) {
    // 简单的离线缓存兜底逻辑
    const cached = JSON.parse(
      localStorage.getItem("monitor_offline_cache") || "[]",
    );
    localStorage.setItem(
      "monitor_offline_cache",
      JSON.stringify(cached.concat(events)),
    );
  }
}
