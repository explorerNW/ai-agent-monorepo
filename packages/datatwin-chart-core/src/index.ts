// =====================================================================
// 1. EchartsCore (核心引擎层 - 纯逻辑，无 DOM 依赖)
// 职责：ECharts 实例生命周期管理、容错处理、API 代理
// =====================================================================

// =====================================================================
// 严格类型契约 (规范对外暴露的接口与事件)
// =====================================================================

import * as echarts from "echarts";
import type { EChartsOption, ECharts } from "echarts";
import type { CSSProperties } from "react";

export type { EChartsOption } from "echarts";

export interface ChartClickPayload {
  type: "chart-item-click";
  seriesName?: string;
  name?: string;
  value?: any;
  data?: any;
  dataIndex?: number;
  componentType?: string;
}

export interface ChartHoverPayload {
  type: "chart-item-hover";
  seriesName?: string;
  name?: string;
  dataIndex?: number;
}

export interface TwinChartRef {
  // 透传核心 API，供业务层进行复杂的跨组件联动
  setOption: (option: EChartsOption, notMerge?: boolean) => void;
  dispatchAction: (payload: any) => void;
  showLoading: (type?: string, opts?: any) => void;
  hideLoading: () => void;
  getInstance: () => ECharts | null;
  resize: () => void;
}

export interface TwinChartProps {
  theme?: "dark" | "light";
  option?: EChartsOption;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  onClick?: (payload: ChartClickPayload) => void;
  onHover?: (payload: ChartHoverPayload) => void;
  onError?: (error: Error) => void;
  style?: CSSProperties;
  className?: string;
}

export class EchartsCore {
  private container: HTMLElement;
  private chart: ECharts | null = null;
  private theme: "dark" | "light";

  constructor(container: HTMLElement, theme: "dark" | "light" = "dark") {
    this.container = container;
    this.theme = theme;
    this.init();
  }

  /**
   * 初始化 ECharts 实例
   * 该方法负责创建图表实例并配置基本选项
   * @private 私有方法，只能在类内部调用
   */
  private init() {
    try {
      // ✅ 前端视角：强制使用 canvas 渲染器，在 Shadow DOM 中性能与兼容性最佳
      // 初始化 ECharts 实例，指定容器、主题和渲染器
      this.chart = echarts.init(
        this.container,
        this.theme === "dark" ? "dark" : undefined,
        { renderer: "canvas" },
      );

      // ✅ 核心修复：强制 Tooltip 等 DOM 组件挂载到 Shadow DOM 内部，防止样式穿透和层级错乱
      this.chart.setOption({
        tooltip: { appendTo: this.container as any, confine: true },
      });
    } catch (err) {
      console.error("[EchartsCore] Init failed:", err);
      throw err;
    }
  }

  public setOption(option: EChartsOption, notMerge: boolean = false) {
    try {
      this.chart?.setOption(option, notMerge);
    } catch (err) {
      // ✅ QA 视角：捕获配置错误，防止基座崩溃，向上抛出标准化错误
      console.error("[EchartsCore] setOption failed:", err);
      this.container.dispatchEvent(
        new CustomEvent("chart-error", { detail: { error: err } }),
      );
    }
  }

  public dispatchAction(payload: any) {
    try {
      this.chart?.dispatchAction(payload);
    } catch (err) {
      console.error("[EchartsCore] dispatchAction failed:", err);
    }
  }

  public showLoading(type: string = "default", opts?: any) {
    this.chart?.showLoading(type, opts);
  }

  public hideLoading() {
    this.chart?.hideLoading();
  }

  public resize() {
    this.chart?.resize();
  }

  public getInstance(): ECharts | null {
    return this.chart;
  }

  public bindEvents() {
    if (!this.chart) return;

    this.chart.on("click", (params: any) => {
      this.container.dispatchEvent(
        new CustomEvent("chart-click", {
          detail: {
            type: "chart-item-click",
            seriesName: params.seriesName,
            name: params.name,
            value: params.value,
            data: params.data,
            dataIndex: params.dataIndex,
          },
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.chart.on("mouseover", (params: any) => {
      this.container.dispatchEvent(
        new CustomEvent("chart-hover", {
          detail: {
            type: "chart-item-hover",
            seriesName: params.seriesName,
            name: params.name,
            dataIndex: params.dataIndex,
          },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  public dispose() {
    this.chart?.dispose();
    this.chart = null;
    this.container.innerHTML = "";
  }
}
