interface EventData {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
  userId: string;
  url: string;
  ua: string;
}

export class AnalyticsSDK {
  private queue: EventData[] = [];
  private maxQueueSize = 10; // 达到10条触发一次上报
  private flushInterval = 5000; // 每5秒强制上报一次
  private timer: any = null;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.init();
  }

  // 初始化：启动定时器和页面卸载监听
  private init() {
    this.startTimer();
    // 页面关闭前强制发送剩余数据 (使用 sendBeacon 保证成功率)
    window.addEventListener("beforeunload", () => this.flush(true));
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

    const payload = JSON.stringify(eventsToSend);

    if (isSync && navigator.sendBeacon) {
      // 页面卸载时使用 sendBeacon，异步但可靠
      navigator.sendBeacon(this.serverUrl, payload);
    } else {
      // 普通场景使用 fetch
      fetch(this.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(() => {
        // 失败重试逻辑：将数据重新放回队列头部
        this.queue.unshift(...eventsToSend);
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
}
