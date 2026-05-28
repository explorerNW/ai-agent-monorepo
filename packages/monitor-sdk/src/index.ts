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
  private privateMetricsReported: boolean = false;
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
    this.observePerformance();
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

  // ================= 自动采集核心逻辑 =================
  // 1. 性能指标监听 (PerformanceObserver)
  private observePerformance() {
    if (!window.PerformanceObserver) return;

    const report = () => {
      if (this.metrics.fcp && this.metrics.lcp) {
        this.enqueue(
          {
            eventType: "performance",
            anonymousId: this.anonymousId,
            pageUrl: window.location.href,
            timestamp: Date.now(),
            eventData: { ...this.metrics },
          },
          true,
        );
        console.log("性能指标上报成功");
      }
    };

    // FCP: 取 first-contentful-paint 的 startTime
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            this.metrics.fcp = entry.startTime;
            break;
          }
        }
        report();
      });
      fcpObserver.observe({ type: "paint", buffered: true });
    } catch {}

    // LCP: 持续跟踪最大的 contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.metrics.lcp = entries[entries.length - 1].startTime;
        report();
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    // FID: processingStart - startTime
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0] as PerformanceEventTiming;
        this.metrics.fid = entry.processingStart - entry.startTime;
        report();
      });
      fidObserver.observe({ type: "first-input", buffered: true });
    } catch {}

    // CLS: 全生命周期累计，不覆盖
    try {
      let cumulativeCls = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cumulativeCls += (entry as any).value;
          }
        }
        this.metrics.cls = cumulativeCls;
        report();
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {}

    // INP: 追踪最差的交互持续时间
    try {
      let worstInp = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = (entry as PerformanceEventTiming).duration;
          if (duration > worstInp) worstInp = duration;
        }
        this.metrics.inp = worstInp;
        report();
      });
      inpObserver.observe({ type: "event", buffered: true });
    } catch {}

    // TTFB: responseStart - requestStart（修正：原代码用 connectStart 值偏大）
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      this.metrics.ttfb = nav.responseStart - nav.requestStart;
      this.metrics.navigationType = nav.type;
    }
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
      if (this.privateMetricsReported) return;
      setTimeout(() => {
        this.observePerformance();
        setTimeout(() => {
          this.enqueue(
            {
              eventType: "custom",
              timestamp: Date.now(),
              pageUrl: window.location.href,
              anonymousId: this.anonymousId,
              eventData: {
                type: "page_view",
                path: window.location.pathname,
                ...this.metrics,
              },
            },
            true,
          );
          this.privateMetricsReported = true;
        }, 500);
      }, 500);
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
