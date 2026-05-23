import { onFCP, onLCP, onCLS, onTTFB, onINP } from "web-vitals";
import { API_CONFIG } from "~/config/env";

export interface PerformanceMetrics {
  pageUrl: string;
  userAgent: string;
  timestamp: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  ttfb?: number;
  inp?: number;
  navigationType: string;
  connectionInfo?: any;
}

export interface APIMetrics {
  url: string;
  method: string;
  startTime: number;
  duration: number;
  status: number;
  size?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    navigationType:
      performance.getEntriesByType("navigation")[0]?.["type"] || "navigate",
  };

  private hasReportedPerformance = false;
  private reportTimeout: NodeJS.Timeout | null = null;
  private apiMetricsBuffer: APIMetrics[] = [];
  private apiReportTimeout: NodeJS.Timeout | null = null;

  constructor(private endpoint: string) {
    this.initConnectionInfo();
    this.collectMetrics();
  }

  private initConnectionInfo() {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      this.metrics.connectionInfo = {
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        downlink: connection.downlink,
      };
    }
  }

  private collectMetrics() {
    // 收集 FCP
    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.schedulePerformanceReport();
    });

    // 收集 LCP
    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.schedulePerformanceReport();
    });

    // 收集 CLS
    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.schedulePerformanceReport();
    });

    // 收集 TTFB
    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.schedulePerformanceReport();
    });

    // 收集 INP (如果浏览器支持)
    if ("PerformanceEventTiming" in window) {
      onINP((metric) => {
        this.metrics.inp = metric.value;
        this.schedulePerformanceReport();
      });
    }

    // 监控网络请求
    this.monitorNetworkRequests();
  }

  private monitorNetworkRequests() {
    // 拦截 fetch 请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const request =
        args[0] instanceof Request ? args[0] : new Request(args[0], args[1]);
      const method = request.method;
      const url = request.url;

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.reportAPIMetric({
          url,
          method,
          startTime,
          duration,
          status: response.status,
          size: Number(response.headers.get("content-length")) || undefined,
        });

        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.reportAPIMetric({
          url,
          method,
          startTime,
          duration,
          status: 0, // 网络错误
        });

        throw error;
      }
    };

    // 拦截 XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    const self = this;
    window.XMLHttpRequest = function () {
      const xhr = new originalXHR();
      const startTime = Date.now();
      const originalOpen = xhr.open;
      let method: string, url: string;

      xhr.open = function (
        _method: string,
        _url: string,
        async = true,
        username?: string | null,
        password?: string | null,
      ) {
        method = _method;
        url = _url;
        return originalOpen.call(
          this,
          _method,
          _url,
          (async = false),
          username,
          password,
        );
      };

      const originalSend = xhr.send;
      xhr.send = function (body?: XMLHttpRequestBodyInit | null) {
        const originalOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function (this: XMLHttpRequest) {
          if (this.readyState === 4) {
            // 请求完成
            const endTime = Date.now();
            const duration = endTime - startTime;

            self.reportAPIMetric({
              url,
              method,
              startTime,
              duration,
              status: this.status,
            });
          }

          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.call(
              this,
              new Event("readystatechange"),
            );
          }
        };

        return originalSend.call(xhr, body);
      };

      return xhr;
    } as any;
  }

  private schedulePerformanceReport() {
    // 如果已经上报过，不再重复上报
    if (this.hasReportedPerformance) {
      return;
    }

    // 如果已经有待执行的定时器，不再创建新的
    if (this.reportTimeout) {
      console.log("[PerformanceSDK] Report already scheduled, waiting...");
      return;
    }

    // 延迟上报，等待所有指标收集完成（最多等待5秒）
    console.log(
      "[PerformanceSDK] Scheduling performance report in 2 seconds...",
    );
    this.reportTimeout = setTimeout(() => {
      this.reportMetrics();
    }, 2000);
  }

  private reportMetrics() {
    // 防止重复上报
    if (this.hasReportedPerformance) {
      console.log("[PerformanceSDK] Already reported, skipping");
      return;
    }

    // 至少需要有一个核心指标才上报
    const hasAnyMetric =
      this.metrics.fcp ||
      this.metrics.lcp ||
      this.metrics.cls !== undefined ||
      this.metrics.ttfb;
    if (!hasAnyMetric) {
      console.log("[PerformanceSDK] No metrics collected yet, waiting...");
      return;
    }

    // 标记为已上报
    this.hasReportedPerformance = true;

    // 清除定时器引用
    if (this.reportTimeout) {
      clearTimeout(this.reportTimeout);
      this.reportTimeout = null;
    }

    console.log("[PerformanceSDK] Reporting performance metrics:", {
      fcp: this.metrics.fcp,
      lcp: this.metrics.lcp,
      cls: this.metrics.cls,
      ttfb: this.metrics.ttfb,
      inp: this.metrics.inp,
    });

    // 发送到后端
    this.sendToBackend(this.metrics);
  }

  private reportAPIMetric(apiMetric: APIMetrics) {
    // 将 API 指标加入缓冲区
    this.apiMetricsBuffer.push(apiMetric);

    // 如果已经有待执行的定时器，不需要重复创建
    if (this.apiReportTimeout) {
      return;
    }

    // 设置批量上报定时器（5秒后）
    this.apiReportTimeout = setTimeout(() => {
      this.flushApiMetrics();
    }, 5000);

    // 如果缓冲区达到 10 条，立即上报并清除定时器
    if (this.apiMetricsBuffer.length >= 10) {
      if (this.apiReportTimeout) {
        clearTimeout(this.apiReportTimeout);
        this.apiReportTimeout = null;
      }
      this.flushApiMetrics();
    }
  }

  private flushApiMetrics() {
    if (this.apiMetricsBuffer.length === 0) {
      console.log("[PerformanceSDK] No API metrics to flush");
      return;
    }

    // 复制并清空缓冲区
    const metricsToSend = [...this.apiMetricsBuffer];
    this.apiMetricsBuffer = [];

    // 清除定时器引用
    if (this.apiReportTimeout) {
      clearTimeout(this.apiReportTimeout);
      this.apiReportTimeout = null;
    }

    console.log(
      `[PerformanceSDK] Flushing ${metricsToSend.length} API metrics`,
    );

    // 批量发送 API 指标
    this.sendToBackend({
      type: "api-batch",
      metrics: metricsToSend,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  private async sendToBackend(data: any) {
    try {
      // 发送到 RabbitMQ 的消息格式
      const message = {
        type: data.type || "performance",
        data,
        sentAt: Date.now(),
      };

      console.log("[PerformanceSDK] Sending data to backend:", message.type);

      // 使用 fetch 发送数据到后端服务
      await fetch(`${API_CONFIG.BASE_URL}/api/performance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      // 只有性能指标上报成功后才标记为已上报
      if (
        data.type === "performance" ||
        (!data.type && data.fcp !== undefined)
      ) {
        this.hasReportedPerformance = true;
        console.log(
          "[PerformanceSDK] Performance metrics reported successfully",
        );
      }
    } catch (error) {
      console.error("Failed to send performance data:", error);
      // 即使失败也标记为已上报，避免无限重试
      if (
        data.type === "performance" ||
        (!data.type && data.fcp !== undefined)
      ) {
        this.hasReportedPerformance = true;
      }
    }
  }
}

// 初始化性能监控
export const initPerformanceMonitoring = (endpoint: string) => {
  new PerformanceMonitor(endpoint);
};
