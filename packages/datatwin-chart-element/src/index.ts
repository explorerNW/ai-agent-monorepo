// =====================================================================
// TwinChartElement (Web Component 层 - 框架无关)
// 职责：Shadow DOM 隔离、ResizeObserver 防抖、DOM 状态管理
// =====================================================================
import type { EChartsOption, ECharts } from "echarts";

import { EchartsCore } from "@datatwin/chart-core";
import type {
  ChartClickPayload,
  ChartHoverPayload,
} from "@datatwin/chart-core";

export interface TwinChartRef {
  // 透传核心 API，供业务层进行复杂的跨组件联动
  setOption: (option: EChartsOption, notMerge?: boolean) => void;
  dispatchAction: (payload: any) => void;
  showLoading: (type?: string, opts?: any) => void;
  hideLoading: () => void;
  getInstance: () => ECharts | null;
  resize: () => void;
}

interface TwinChartProps {
  theme?: "dark" | "light";
  option?: EChartsOption;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  onClick?: (payload: ChartClickPayload) => void;
  onHover?: (payload: ChartHoverPayload) => void;
  onError?: (error: Error) => void;
  style?: CSSStyleDeclaration;
  className?: string;
}

export class TwinChartElement extends HTMLElement {
  private core: EchartsCore | null = null;
  private ro: ResizeObserver | null = null;
  private resizeTimer: number | null = null;
  private wrapEl: HTMLElement | null = null;
  private emptyEl: HTMLElement | null = null;

  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: "open" });
    // ✅ 前端视角：注入基础样式，确保内部 DOM 在 Shadow DOM 中表现正常
    shadow.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; position: relative; }
        .chart-wrap { width: 100%; height: 100%; }
        .empty-state {
          position: absolute; inset: 0; display: none;
          align-items: center; justify-content: center;
          color: #888; font-size: 14px; background: rgba(0,0,0,0.05);
        }
        :host([theme="dark"]) .empty-state { color: #666; background: rgba(255,255,255,0.02); }
      </style>
      <div class="chart-wrap"></div>
      <div class="empty-state">暂无数据</div>
    `;

    this.wrapEl = shadow.querySelector(".chart-wrap") as HTMLElement;
    this.emptyEl = shadow.querySelector(".empty-state") as HTMLElement;

    const theme = (this.getAttribute("theme") as any) || "dark";
    this.core = new EchartsCore(this.wrapEl, theme);
    this.core.bindEvents();

    // ✅ 性能优化：ResizeObserver 增加 150ms 防抖，防止拖拽窗口时高频重绘
    this.ro = new ResizeObserver(() => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.core?.resize(), 150);
    });
    this.ro.observe(this);
  }

  disconnectedCallback() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.ro?.disconnect();
    this.core?.dispose();
  }

  // 暴露给外部的控制方法
  public setOption(opt: EChartsOption, notMerge?: boolean) {
    this.core?.setOption(opt, notMerge);
  }
  public dispatchAction(payload: any) {
    this.core?.dispatchAction(payload);
  }
  public showLoading(type?: string, opts?: any) {
    this.core?.showLoading(type, opts);
  }
  public hideLoading() {
    this.core?.hideLoading();
  }
  public getInstance() {
    return this.core?.getInstance();
  }
  public resize() {
    this.core?.resize();
  }

  public setEmpty(isEmpty: boolean, text?: string) {
    if (this.emptyEl) {
      this.emptyEl.style.display = isEmpty ? "flex" : "none";
      if (text) this.emptyEl.textContent = text;
    }
  }
}
