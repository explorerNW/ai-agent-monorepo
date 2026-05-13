import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import type { WebVitalsData } from "~/types/performance";

interface TimelineChartProps {
  data: WebVitalsData[];
  days: number;
}

export function TimelineChart({ data, days }: TimelineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }

    // Helper function to format timestamp
    const formatTimestamp = (timestamp: string): string => {
      const date = new Date(timestamp);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
      return `${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    };

    // Group data by date or time based on days selection
    const groupedData: Record<
      string,
      { lcp: number[]; fcp: number[]; cls: number[]; ttfb: number[] }
    > = {};

    data.forEach((item) => {
      const timestamp = new Date(item.timestamp);
      const key =
        days === 1 ? timestamp.toISOString() : timestamp.toLocaleDateString();

      if (!groupedData[key]) {
        groupedData[key] = { lcp: [], fcp: [], cls: [], ttfb: [] };
      }
      if (item.metrics.lcp?.value) {
        groupedData[key].lcp.push(item.metrics.lcp.value);
      }
      if (item.metrics.fcp?.value) {
        groupedData[key].fcp.push(item.metrics.fcp.value);
      }
      if (item.metrics.cls?.value) {
        groupedData[key].cls.push(item.metrics.cls.value);
      }
      if (item.metrics.ttfb?.value) {
        groupedData[key].ttfb.push(item.metrics.ttfb.value);
      }
    });

    const keys = Object.keys(groupedData).sort();

    const displayLabels =
      days === 1 ? keys.map((key) => formatTimestamp(key)) : keys;

    const avgLCP = keys.map(
      (key) =>
        groupedData[key].lcp.reduce((a, b) => a + b, 0) /
          groupedData[key].lcp.length || 0,
    );
    const avgFCP = keys.map(
      (key) =>
        groupedData[key].fcp.reduce((a, b) => a + b, 0) /
          groupedData[key].fcp.length || 0,
    );
    const avgCLS = keys.map(
      (key) =>
        groupedData[key].cls.reduce((a, b) => a + b, 0) /
          groupedData[key].cls.length || 0,
    );
    const avgTTFB = keys.map(
      (key) =>
        groupedData[key].ttfb.reduce((a, b) => a + b, 0) /
          groupedData[key].ttfb.length || 0,
    );

    const option: EChartsOption = {
      title: {
        text: "Performance Trends Over Time",
        left: "center",
        textStyle: { color: "#fff" },
      },
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const originalTime =
            days === 1
              ? formatTimestamp(keys[params[0].dataIndex])
              : params[0].axisValue;
          let result = `<div style="font-weight:bold">${originalTime}</div>`;
          params.forEach((param: any) => {
            result += `<div>${param.marker} ${param.seriesName}: ${param.value.toFixed(param.seriesName === "CLS" ? 5 : 0)}${param.seriesName === "CLS" ? "" : "ms"}</div>`;
          });
          return result;
        },
      },
      legend: {
        data: ["LCP", "FCP", "CLS", "TTFB"],
        textStyle: { color: "#999" },
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
        top: 70,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: displayLabels,
        axisLabel: {
          color: "#999",
          rotate: days === 1 ? 45 : 0,
          fontSize: days === 1 ? 10 : 12,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Time (ms)",
          position: "left",
          axisLabel: { color: "#999" },
          splitLine: { lineStyle: { color: "#333" } },
        },
        {
          type: "value",
          name: "CLS",
          position: "right",
          axisLabel: { color: "#999" },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "LCP",
          type: "line",
          data: avgLCP,
          smooth: true,
          itemStyle: { color: "#1890ff" },
        },
        {
          name: "FCP",
          type: "line",
          data: avgFCP,
          smooth: true,
          itemStyle: { color: "#52c41a" },
        },
        {
          name: "CLS",
          type: "line",
          yAxisIndex: 1,
          data: avgCLS,
          smooth: true,
          itemStyle: { color: "#faad14" },
        },
        {
          name: "TTFB",
          type: "line",
          data: avgTTFB,
          smooth: true,
          itemStyle: { color: "#722ed1" },
        },
      ],
      dataZoom: [
        {
          type: "slider",
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: 10,
          height: 20,
          handleSize: "80%",
          showDetail: false,
          textStyle: { color: "#999" },
          fillerColor: "rgba(24, 144, 255, 0.2)",
          borderColor: "#333",
          handleStyle: {
            color: "#1890ff",
            borderColor: "#1890ff",
          },
        },
        {
          type: "inside",
          xAxisIndex: [0],
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
        },
      ],
    };

    chart.setOption(option, { notMerge: false, lazyUpdate: true });

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [data, days]);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
