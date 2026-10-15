import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { TwinChartRef, TwinChartProps } from "@datatwin/chart-core";
import { TwinChartElement } from "@datatwin/chart-element";

import "@datatwin/chart-element/register";

// =====================================================================
// TwinChart (React 适配层)
// 职责：状态映射、事件转发、Ref 暴露、生命周期管理
// =====================================================================
export const TwinChart = forwardRef<TwinChartRef, TwinChartProps>(
  (
    {
      theme = "dark",
      option,
      loading,
      empty,
      emptyText,
      onClick,
      onHover,
      onError,
      style,
      className,
    },
    ref,
  ) => {
    const elRef = useRef<TwinChartElement>(null);

    // ✅ 架构师视角：通过 useImperativeHandle 透传底层核心 API，支持外部复杂联动
    useImperativeHandle(ref, () => ({
      setOption: (opt, notMerge) => elRef.current?.setOption(opt, notMerge),
      dispatchAction: (payload) => elRef.current?.dispatchAction(payload),
      showLoading: (type, opts) => elRef.current?.showLoading(type, opts),
      hideLoading: () => elRef.current?.hideLoading(),
      getInstance: () => elRef.current?.getInstance() || null,
      resize: () => elRef.current?.resize(),
    }));

    // 处理 Option 更新
    useEffect(() => {
      if (option && elRef.current?.setOption) {
        elRef.current.setOption(option);
      }
    }, [option]);

    // 处理 Loading 状态
    useEffect(() => {
      if (!elRef.current) return;
      if (loading) {
        elRef.current.showLoading("default", {
          text: "",
          color: "#0077ff",
          maskColor: "rgba(0, 0, 0, 0.8)",
        });
      } else {
        elRef.current?.hideLoading?.();
      }
    }, [loading]);

    // 处理 Empty 状态
    useEffect(() => {
      elRef.current?.setEmpty?.(!!empty, emptyText);
    }, [empty, emptyText]);

    // 事件监听绑定
    useEffect(() => {
      const el = elRef.current;
      if (!el) return;

      const handleClick = (e: Event) => onClick?.((e as CustomEvent).detail);
      const handleHover = (e: Event) => onHover?.((e as CustomEvent).detail);
      const handleError = (e: Event) =>
        onError?.((e as CustomEvent).detail.error);

      el.addEventListener("chart-click", handleClick);
      el.addEventListener("chart-hover", handleHover);
      el.addEventListener("chart-error", handleError);

      return () => {
        el.removeEventListener("chart-click", handleClick);
        el.removeEventListener("chart-hover", handleHover);
        el.removeEventListener("chart-error", handleError);
      };
    }, [onClick, onHover, onError]);

    return (
      <twin-chart
        ref={elRef}
        theme={theme}
        style={style}
        className={className}
      />
    );
  },
);

TwinChart.displayName = "TwinChart";
