import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import type { WebVitalsData } from "~/types/performance";

interface ApiPerformanceChartProps {
  data: WebVitalsData[];
}

export function ApiPerformanceChart({ data }: ApiPerformanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }

    // Helper function to extract API path from full URL
    const extractApiPath = (url: string): string => {
      try {
        if (url.startsWith("http://") || url.startsWith("https://")) {
          const urlObj = new URL(url);
          return urlObj.pathname;
        }
        return url;
      } catch {
        return url.replace(/^https?:\/\/[^\/]+/, "");
      }
    };

    // Extract API call data from metrics
    const apiCallsData: Array<{
      url: string;
      avgDuration: number;
      successRate: number;
    }> = [];

    data.forEach((item) => {
      const apiCalls = item.metrics.apiCalls;

      if (apiCalls && Array.isArray(apiCalls)) {
        apiCalls.forEach((apiCall) => {
          apiCallsData.push({
            url: apiCall.url,
            avgDuration: parseFloat(apiCall.duration.toFixed(3)),
            successRate: apiCall.success ? 100 : 0,
          });
        });
      }
    });

    // Group by URL and calculate averages
    const urlStats: Record<
      string,
      { durations: number[]; successes: number[] }
    > = {};
    apiCallsData.forEach((call) => {
      const apiPath = extractApiPath(call.url);
      if (!urlStats[apiPath]) {
        urlStats[apiPath] = { durations: [], successes: [] };
      }
      urlStats[apiPath].durations.push(call.avgDuration);
      urlStats[apiPath].successes.push(call.successRate);
    });

    const urls = Object.keys(urlStats).slice(0, 10); // Top 10 endpoints

    if (urls.length === 0) {
      // Show empty state
      const option: EChartsOption = {
        title: {
          text: "API Performance",
          left: "center",
          textStyle: { color: "#fff" },
        },
        graphic: {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: "No API performance data available",
            fill: "#999",
            fontSize: 16,
          },
        },
      };
      chart.setOption(option, { notMerge: false, lazyUpdate: true });
      return;
    }

    const avgDurations = urls.map((url) => {
      const stats = urlStats[url];
      return (
        stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
      ).toFixed(2);
    });
    const successRates = urls.map((url) => {
      const stats = urlStats[url];
      return (
        stats.successes.reduce((sum, s) => sum + s, 0) / stats.successes.length
      ).toFixed(2);
    });

    const option: EChartsOption = {
      title: {
        text: "API Performance",
        left: "center",
        textStyle: { color: "#fff" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        data: ["Avg Duration (ms)", "Success Rate (%)"],
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
        data: urls,
        axisLabel: {
          color: "#999",
          rotate: 45,
          fontSize: 10,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Duration (ms)",
          position: "left",
          axisLabel: { color: "#999" },
          splitLine: { lineStyle: { color: "#333" } },
        },
        {
          type: "value",
          name: "Success Rate (%)",
          position: "right",
          axisLabel: { color: "#999" },
          splitLine: { show: false },
          max: 100,
        },
      ],
      series: [
        {
          name: "Avg Duration (ms)",
          type: "bar",
          data: avgDurations,
          itemStyle: { color: "#1890ff" },
        },
        {
          name: "Success Rate (%)",
          type: "line",
          yAxisIndex: 1,
          data: successRates,
          smooth: true,
          itemStyle: { color: "#52c41a" },
        },
      ],
    };

    chart.setOption(option, { notMerge: false, lazyUpdate: true });

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
