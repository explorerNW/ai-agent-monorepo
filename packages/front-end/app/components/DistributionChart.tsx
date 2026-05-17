import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import type { WebVitalsData } from "~/types/performance";

interface DistributionChartProps {
  data: WebVitalsData[];
  title: string;
  metricKey: keyof Pick<
    WebVitalsData["metrics"],
    "lcp" | "fcp" | "cls" | "ttfb"
  >;
  thresholds: {
    good: number;
    needsImprovement: number;
    labels: [string, string, string];
  };
}

export function DistributionChart({
  data,
  title,
  metricKey,
  thresholds,
}: DistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }

    const values = data
      .map((item) => item.metrics[metricKey]?.value || 0)
      .filter((v) => v >= 0);

    const stats = { good: 0, needsImprovement: 0, poor: 0 };
    values.forEach((v) => {
      if (v <= thresholds.good) stats.good++;
      else if (v <= thresholds.needsImprovement) stats.needsImprovement++;
      else stats.poor++;
    });

    const option: EChartsOption = {
      title: {
        text: title,
        left: "center",
        textStyle: { color: "#fff" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: thresholds.labels,
        axisLabel: { color: "#999" },
      },
      yAxis: {
        type: "value",
        name: "Count",
        axisLabel: { color: "#999" },
        splitLine: { lineStyle: { color: "#333" } },
      },
      series: [
        {
          name: title.split(" ")[0],
          type: "bar",
          data: [
            stats.good,
            values.filter(
              (v) => v > thresholds.good && v <= thresholds.needsImprovement,
            ).length,
            stats.needsImprovement,
            stats.poor,
          ],
          itemStyle: {
            color: (params) => {
              const colors = ["#52c41a", "#faad14", "#ff4d4f"];
              return colors[params.dataIndex];
            },
          },
        },
      ],
    };

    chart.setOption(option, { notMerge: false, lazyUpdate: true });

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [data, title, metricKey, thresholds]);

  return <div ref={chartRef} style={{ width: "100%", height: "300px" }} />;
}
