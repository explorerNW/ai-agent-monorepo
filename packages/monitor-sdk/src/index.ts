/**
 * 企业级前端监控 SDK（优化版）
 * 核心设计：采集 → 汇总 → 上报 三条线解耦
 *   - 采集线：PerformanceObserver / Error / Fetch 只写 metrics 或推 event
 *   - 汇总线：性能指标作为页面摘要，在离页/路由切换/定时触发时一次性发出
 *   - 上报线：统一队列 + sendBeacon 优先 + keepalive fetch 兜底
 *
 * 本次优化要点：
 *   1. LCP 取值修正：按 W3C 规范取所有 entry 中 value(renderTime||loadTime) 最大者，
 *      而非"数组末位 entry 的 startTime"（末位不保证最大，且 startTime ≠ 真正呈现时刻）。
 *   2. LCP 定格：首次交互(input/keydown/pointerdown)或页面隐藏时锁死 LCP，
 *      避免用户停留期间晚到的懒加载大图/异步内容把 LCP 抬到几千 ms。
 *   3. 其余逻辑保持不变。
 */

// ==================== 类型定义 ====================

interface MonitorEvent {
  eventType: "performance" | "error" | "api" | "custom";
  timestamp: number;
  pageUrl: string;
  anonymousId: string;
  userId?: string;
  eventData?: Record<string, any>;
}

interface PageMetrics {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  inp: number;
  ttfb: number;
  userAgent: string;
  navigationType: string;
}

interface SDKConfig {
  reportUrl: string;
  appId: string;
  maxQueueSize?: number;
  flushInterval?: number;
  /** 性能指标采集的等待超时（ms），FCP+LCP 超时未就绪则放弃本次 */
  metricsTimeout?: number;
}

// ==================== SDK 主体 ====================

export class EnterpriseMonitorSDK {
  private config: Required<SDKConfig>;
  private queue: MonitorEvent[] = [];
  private anonymousId: string;
  private isInitialized = false;

  // ── 性能采集状态 ──
  private observers: PerformanceObserver[] = [];
  private metrics: PageMetrics;
  private metricsReported = false;
  private metricsTimer: ReturnType<typeof setTimeout> | null = null;
  /** 是否为初始页面加载（非 SPA 路由切换） */
  private isInitialLoad = true;
  /** SPA 路由切换的起始时间戳，用于计算页面内 TTFB */
  private routeStartTime = 0;

  // ── LCP 取值与定格（优化点 1、2） ──
  /** 当前已观测到的最大 LCP value（renderTime || loadTime） */
  private lcpValue = 0;
  /** LCP 是否已定格（首次交互 / 页面隐藏后不再更新） */
  private lcpLocked = false;
  /** 是否已绑定 LCP 定格监听 */
  private lcpLockBound = false;

  // ── 定时上报 ──
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  // ── SPA 路由 ──
  private originalPushState: typeof history.pushState | null = null;

  constructor(config: SDKConfig) {
    this.config = {
      maxQueueSize: 20,
      flushInterval: 15000,
      metricsTimeout: 10000,
      ...config,
    };

    this.anonymousId = this.getOrCreateAnonymousId();
    this.metrics = this.createEmptyMetrics();

    this.startFlushTimer();
    this.bindPageLeave();
  }

  // ================= 公开 API =================

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.startMetricsCollection();
    this.observeErrors();
    this.hijackFetch();
    this.observeSPARoute();

    console.log("[MonitorSDK] 初始化完成");
  }

  /** 代理壳回捞：加载前暂存的指令 */
  public replayQueue(commands: Array<{ method: string; data?: any; userId?: string }>) {
    for (const cmd of commands) {
      if (cmd.method === "track") this.track(cmd.data);
      if (cmd.method === "identify") this.identify(cmd.userId!);
    }
  }

  /** 自定义埋点 */
  public track(eventData: Record<string, any>) {
    this.push({
      eventType: "custom",
      timestamp: Date.now(),
      pageUrl: window.location.href,
      anonymousId: this.anonymousId,
      eventData,
    });
  }

  /** 关联用户 ID */
  public identify(userId: string) {
    // 可扩展：关联 anonymousId → userId
    console.log("[MonitorSDK] identify:", userId);
  }

  public destroy() {
    this.flushAll();
    this.disconnectObservers();
    this.clearMetricsTimer();
    this.unbindLcpLock();
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.originalPushState) history.pushState = this.originalPushState;
    window.removeEventListener("hashchange", this.onRouteChange);
    window.removeEventListener("popstate", this.onRouteChange);
  }

  // ================= 性能指标采集（只采集，不触发上报） =================

  private createEmptyMetrics(): PageMetrics {
    return {
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      inp: 0,
      ttfb: 0,
      userAgent: navigator.userAgent,
      navigationType: "",
    };
  }

  private startMetricsCollection() {
    if (!window.PerformanceObserver) return;

    this.disconnectObservers();
    this.unbindLcpLock();
    this.metrics = this.createEmptyMetrics();
    this.metricsReported = false;
    // 重置 LCP 取值与定格状态
    this.lcpValue = 0;
    this.lcpLocked = false;

    // 绑定 LCP 定格：首次交互 / 页面隐藏时锁死（优化点 2）
    this.bindLcpLock();

    if (this.isInitialLoad) {
      // ── 初始页面加载：用 buffered: true 回放历史 entries ──

      // TTFB：从 navigation timing 直接取
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        this.metrics.ttfb = nav.responseStart - nav.requestStart;
        this.metrics.navigationType = nav.type;
      }

      // FCP
      this.createObserver("paint", (list) => {
        if (this.metricsReported) return;
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            this.metrics.fcp = entry.startTime;
            break;
          }
        }
      }, true);

      // LCP：取所有 entry 中 value(renderTime||loadTime) 的最大值（优化点 1）
      this.createObserver("largest-contentful-paint", (list) => {
        if (this.metricsReported || this.lcpLocked) return;
        for (const entry of list.getEntries() as any[]) {
          const value = entry.renderTime || entry.loadTime || 0;
          if (value > this.lcpValue) {
            this.lcpValue = value;
            this.metrics.lcp = value;
          }
        }
      }, true);

      // FID：首次输入延迟；首次输入同时也是 LCP 的定格时刻
      this.createObserver("first-input", (list) => {
        if (this.metricsReported) return;
        const entry = list.getEntries()[0] as PerformanceEventTiming;
        this.metrics.fid = entry.processingStart - entry.startTime;
        this.lockLcp(); // 用户已交互，LCP 定格
      }, true);

      // CLS：全生命周期累计
      this.createObserver("layout-shift", (list) => {
        if (this.metricsReported) return;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.metrics.cls += (entry as any).value;
          }
        }
      }, true);

      // INP：追踪最差交互
      this.createObserver("event", (list) => {
        if (this.metricsReported) return;
        for (const entry of list.getEntries()) {
          const duration = (entry as PerformanceEventTiming).duration;
          if (duration > this.metrics.inp) this.metrics.inp = duration;
        }
      }, true);
    } else {
      // ── SPA 路由切换：用 buffered: false，只采集路由切换后的新 events ──

      this.metrics.navigationType = "navigate";
      this.routeStartTime = performance.now();
      // SPA 路由切换的 TTFB 近似为 0（无网络请求）
      this.metrics.ttfb = 0;

      // FCP：SPA 内跳转没有 paint 事件，用首次 DOM 渲染完成时间近似
      requestAnimationFrame(() => {
        if (!this.metricsReported && this.metrics.fcp === 0) {
          this.metrics.fcp = performance.now() - this.routeStartTime;
        }
      });

      // LCP：SPA 内跳转没有 largest-contentful-paint 事件，用 FCP 近似
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!this.metricsReported && this.metrics.lcp === 0) {
            this.metrics.lcp = performance.now() - this.routeStartTime;
          }
        });
      });

      // CLS：SPA 路由切换后的布局偏移
      this.createObserver("layout-shift", (list) => {
        if (this.metricsReported) return;
        for (const entry of list.getEntries()) {
          // 只统计路由切换后发生的 layout shift
          if (entry.startTime >= this.routeStartTime && !(entry as any).hadRecentInput) {
            this.metrics.cls += (entry as any).value;
          }
        }
      }, false);

      // INP：SPA 路由切换后的交互延迟
      this.createObserver("event", (list) => {
        if (this.metricsReported) return;
        for (const entry of list.getEntries()) {
          if (entry.startTime >= this.routeStartTime) {
            const duration = (entry as PerformanceEventTiming).duration;
            if (duration > this.metrics.inp) this.metrics.inp = duration;
          }
        }
      }, false);
    }

    // 超时兜底：metricsTimeout 后如果还没上报，强制上报已采集到的
    this.clearMetricsTimer();
    this.metricsTimer = setTimeout(() => {
      if (!this.metricsReported) this.reportMetrics();
    }, this.config.metricsTimeout);
  }

  // ── LCP 定格逻辑（优化点 2） ──

  /** 用户首次交互或页面隐藏时锁死 LCP，阻止晚到 entry 抬高 LCP */
  private lockLcp() {
    this.lcpLocked = true;
  }

  private onLcpInteraction = () => this.lockLcp();

  private onVisibilityForLcp = () => {
    if (document.visibilityState === "hidden") this.lockLcp();
  };

  /** 绑定首次交互 / 页面隐藏监听，命中即定格 LCP */
  private bindLcpLock() {
    if (this.lcpLockBound) return;
    const opts: AddEventListenerOptions = { once: true, capture: true };
    ["pointerdown", "keydown"].forEach((type) => {
      window.addEventListener(type, this.onLcpInteraction, opts);
    });
    document.addEventListener("visibilitychange", this.onVisibilityForLcp);
    this.lcpLockBound = true;
  }

  /** 卸载 LCP 定格监听 */
  private unbindLcpLock() {
    if (!this.lcpLockBound) return;
    window.removeEventListener("pointerdown", this.onLcpInteraction, true);
    window.removeEventListener("keydown", this.onLcpInteraction, true);
    document.removeEventListener("visibilitychange", this.onVisibilityForLcp);
    this.lcpLockBound = false;
  }

  private createObserver(type: string, callback: PerformanceObserverCallback, buffered = true) {
    try {
      const obs = new PerformanceObserver(callback);
      obs.observe({ type, buffered });
      this.observers.push(obs);
    } catch {
      // 浏览器不支持该 entry type，静默跳过
    }
  }

  private disconnectObservers() {
    for (const obs of this.observers) {
      try { obs.disconnect(); } catch {}
    }
    this.observers = [];
  }

  private clearMetricsTimer() {
    if (this.metricsTimer) {
      clearTimeout(this.metricsTimer);
      this.metricsTimer = null;
    }
  }

  /**
   * 性能指标汇总上报（页面摘要模式）
   * 触发时机：离页 / 路由切换 / 超时兜底
   * 保证每个页面生命周期只发一次
   */
  private reportMetrics() {
    if (this.metricsReported) return;
    this.metricsReported = true;
    this.clearMetricsTimer();
    this.disconnectObservers();
    this.unbindLcpLock();

    // FCP 和 LCP 至少有一个才上报（纯 SPA 内跳转可能都没有）
    if (!this.metrics.fcp && !this.metrics.lcp) return;

    this.push({
      eventType: "performance",
      timestamp: Date.now(),
      pageUrl: window.location.href,
      anonymousId: this.anonymousId,
      eventData: { ...this.metrics },
    });

    console.log("[MonitorSDK] 性能指标上报", {
      fcp: this.metrics.fcp.toFixed(0),
      lcp: this.metrics.lcp.toFixed(0),
      cls: this.metrics.cls.toFixed(4),
      inp: this.metrics.inp,
    });
  }

  // ================= 错误采集 =================

  private observeErrors() {
    window.addEventListener("error", (e: ErrorEvent) => {
      this.push({
        eventType: "error",
        timestamp: Date.now(),
        pageUrl: window.location.href,
        anonymousId: this.anonymousId,
        eventData: {
          message: e.message,
          stack: e.error?.stack,
          filename: e.filename,
        },
      });
    });

    window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
      this.push({
        eventType: "error",
        timestamp: Date.now(),
        pageUrl: window.location.href,
        anonymousId: this.anonymousId,
        eventData: {
          reason: String(e.reason),
          type: "unhandledrejection",
        },
      });
    });
  }

  // ================= 接口耗时采集（Fetch + XHR） =================

  private hijackFetch() {
    const sdk = this;

    // Fetch 劫持
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        sdk.reportApi(args[0], startTime, true);
        return response;
      } catch (error) {
        sdk.reportApi(args[0], startTime, false, error);
        throw error;
      }
    };

    // XHR 劫持
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      (this as any).__monitor_url = url;
      (this as any).__monitor_start = 0;
      return originalOpen.apply(this, [method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function (...args: any[]) {
      const xhr = this;
      (xhr as any).__monitor_start = performance.now();
      xhr.addEventListener("loadend", () => {
        const duration = performance.now() - (xhr as any).__monitor_start;
        const url = (xhr as any).__monitor_url || "";
        const success = xhr.status >= 200 && xhr.status < 400;
        sdk.push({
          eventType: "api",
          timestamp: Date.now(),
          pageUrl: window.location.href,
          anonymousId: sdk.anonymousId,
          eventData: {
            url: String(url),
            duration: duration.toFixed(2),
            success,
            error: success ? undefined : `HTTP ${xhr.status}`,
          },
        });
      });
      return originalSend.apply(this, args as Parameters<typeof originalSend>);
    };
  }

  private reportApi(url: any, startTime: number, success: boolean, error?: any) {
    const duration = performance.now() - startTime;
    this.push({
      eventType: "api",
      timestamp: Date.now(),
      pageUrl: window.location.href,
      anonymousId: this.anonymousId,
      eventData: {
        url: String(url),
        duration: duration.toFixed(2),
        success,
        error: error?.message,
      },
    });
  }

  // ================= SPA 路由监听 =================

  private observeSPARoute() {
    window.addEventListener("hashchange", this.onRouteChange);
    window.addEventListener("popstate", this.onRouteChange);

    this.originalPushState = history.pushState;
    history.pushState = (...args) => {
      this.originalPushState!.apply(history, args);
      this.onRouteChange();
    };
  }

  private onRouteChange = () => {
    // 1. 先把上一页的性能指标发出去
    this.reportMetrics();

    // 2. 标记为 SPA 路由切换（后续采集不再用 buffered: true）
    this.isInitialLoad = false;

    // 3. 发送 page_view 事件
    this.push({
      eventType: "custom",
      timestamp: Date.now(),
      pageUrl: window.location.href,
      anonymousId: this.anonymousId,
      eventData: {
        type: "page_view",
        path: window.location.pathname,
        ...this.metrics,
      },
    });

    // 4. 为新页面重新采集性能指标（SPA 模式）
    this.startMetricsCollection();
  };

  // ================= 上报线：统一队列 + 离页兜底 =================

  private push(event: MonitorEvent) {
    this.queue.push(event);
    if (this.queue.length >= this.config.maxQueueSize) {
      this.flushAll();
    }
  }

  /** 发送队列中所有事件 */
  private flushAll() {
    if (this.queue.length === 0) return;

    const events = this.queue;
    this.queue = [];

    const blob = new Blob([JSON.stringify(events)], { type: "application/json" });

    if (navigator.sendBeacon(this.config.reportUrl, blob)) return;

    // sendBeacon 失败 → keepalive fetch
    fetch(this.config.reportUrl, {
      method: "POST",
      body: blob,
      keepalive: true,
    }).catch(() => {
      // 极端兜底：localStorage
      this.saveOffline(events);
    });
  }

  /** 定时上报 */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flushAll(), this.config.flushInterval);
  }

  /** 离页上报：visibilitychange 比 beforeunload 更可靠 */
  private bindPageLeave() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.reportMetrics(); // 离页时确保性能指标已上报
        this.flushAll();
      }
    });
  }

  // ================= 工具方法 =================

  private getOrCreateAnonymousId(): string {
    const KEY = "monitor_anonymous_id";
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = "anon_" + Math.random().toString(36).substring(2);
      localStorage.setItem(KEY, id);
    }
    return id;
  }

  private saveOffline(events: MonitorEvent[]) {
    try {
      const KEY = "monitor_offline_cache";
      const cached: MonitorEvent[] = JSON.parse(localStorage.getItem(KEY) || "[]");
      localStorage.setItem(KEY, JSON.stringify(cached.concat(events)));
    } catch {
      // localStorage 满了就放弃
    }
  }
}