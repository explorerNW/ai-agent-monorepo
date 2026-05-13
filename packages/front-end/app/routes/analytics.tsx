import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import { getWebVitalsStats } from "~/services/api";
import { BottomNavigation } from "~/components/BottomNavigation";
import type { WebVitalsData } from "~/types/performance";

export default function Analytics() {
  const [data, setData] = useState<WebVitalsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const lcpChartRef = useRef<HTMLDivElement>(null);
  const fcpChartRef = useRef<HTMLDivElement>(null);
  const clsChartRef = useRef<HTMLDivElement>(null);
  const ttfbChartRef = useRef<HTMLDivElement>(null);
  const timelineChartRef = useRef<HTMLDivElement>(null);
  const apiPerformanceChartRef = useRef<HTMLDivElement>(null);
  const routePerformanceChartRef = useRef<HTMLDivElement>(null);

  // Fetch data on component mount or when days changes
  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getWebVitalsStats(days);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize charts when data changes
  useEffect(() => {
    if (data.length > 0) {
      // Use requestAnimationFrame to batch chart updates and avoid blocking UI
      requestAnimationFrame(() => {
        initLCPChart();
        initFCPChart();
        initCLSChart();
        initTTFBChart();
        initTimelineChart();
        initApiPerformanceChart();
        initRoutePerformanceChart();
      });
    }
  }, [data]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      disposeCharts();
    };
  }, []);

  const disposeCharts = () => {
    [
      lcpChartRef,
      fcpChartRef,
      clsChartRef,
      ttfbChartRef,
      timelineChartRef,
      apiPerformanceChartRef,
      routePerformanceChartRef,
    ].forEach((ref) => {
      if (ref.current) {
        const chart = echarts.getInstanceByDom(ref.current);
        if (chart) {
          chart.dispose();
        }
      }
    });
  };

  const initLCPChart = () => {
    if (!lcpChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(lcpChartRef.current);
    if (!chart) {
      chart = echarts.init(lcpChartRef.current);
    }

    const lcpValues = data
      .map((item) => item.metrics.lcp?.value || 0)
      .filter((v) => v > 0);

    const stats = { good: 0, needsImprovement: 0, poor: 0 };
    lcpValues.forEach((v) => {
      if (v <= 2500) stats.good++;
      else if (v <= 4000) stats.needsImprovement++;
      else stats.poor++;
    });

    const option: EChartsOption = {
      title: {
        text: "LCP Distribution",
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
        data: ["Good (≤2.5s)", "Needs Improvement (2.5-4s)", "Poor (>4s)"],
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
          name: "LCP",
          type: "bar",
          data: [
            stats.good,
            lcpValues.filter((v) => v > 2500 && v <= 4000).length,
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

    // Use notMerge: false for incremental update (default behavior)
    // This merges with existing options instead of replacing everything
    chart.setOption(option, { notMerge: false, lazyUpdate: true });
  };

  const initFCPChart = () => {
    if (!fcpChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(fcpChartRef.current);
    if (!chart) {
      chart = echarts.init(fcpChartRef.current);
    }

    const fcpValues = data
      .map((item) => item.metrics.fcp?.value || 0)
      .filter((v) => v > 0);

    const stats = { good: 0, needsImprovement: 0, poor: 0 };
    fcpValues.forEach((v) => {
      if (v <= 1800) stats.good++;
      else if (v <= 3000) stats.needsImprovement++;
      else stats.poor++;
    });

    const option: EChartsOption = {
      title: {
        text: "FCP Distribution",
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
        data: ["Good (≤1.8s)", "Needs Improvement (1.8-3s)", "Poor (>3s)"],
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
          name: "FCP",
          type: "bar",
          data: [stats.good, stats.needsImprovement, stats.poor],
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
  };

  const initCLSChart = () => {
    if (!clsChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(clsChartRef.current);
    if (!chart) {
      chart = echarts.init(clsChartRef.current);
    }

    const clsValues = data
      .map((item) => item.metrics.cls?.value || 0)
      .filter((v) => v > 0);

    const stats = { good: 0, needsImprovement: 0, poor: 0 };
    clsValues.forEach((v) => {
      if (v <= 0.1) stats.good++;
      else if (v <= 0.25) stats.needsImprovement++;
      else stats.poor++;
    });

    const option: EChartsOption = {
      title: {
        text: "CLS Distribution",
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
        data: ["Good (≤0.1)", "Needs Improvement (0.1-0.25)", "Poor (>0.25)"],
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
          name: "CLS",
          type: "bar",
          data: [stats.good, stats.needsImprovement, stats.poor],
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
  };

  const initTTFBChart = () => {
    if (!ttfbChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(ttfbChartRef.current);
    if (!chart) {
      chart = echarts.init(ttfbChartRef.current);
    }

    const ttfbValues = data
      .map((item) => item.metrics.ttfb?.value || 0)
      .filter((v) => v > 0);

    const stats = { good: 0, needsImprovement: 0, poor: 0 };
    ttfbValues.forEach((v) => {
      if (v <= 800) stats.good++;
      else if (v <= 1800) stats.needsImprovement++;
      else stats.poor++;
    });

    const option: EChartsOption = {
      title: {
        text: "TTFB Distribution",
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
        data: [
          "Good (≤800ms)",
          "Needs Improvement (800-1800ms)",
          "Poor (>1800ms)",
        ],
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
          name: "TTFB",
          type: "bar",
          data: [stats.good, stats.needsImprovement, stats.poor],
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
  };

  const initTimelineChart = () => {
    if (!timelineChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(timelineChartRef.current);
    if (!chart) {
      chart = echarts.init(timelineChartRef.current);
    }

    // Helper function to format timestamp as MM:DD:SS:SSS
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
      // Use time format for last 24h, date format for longer periods
      const key =
        days === 1
          ? timestamp.toISOString() // Format: "2023-07-05T12:34:56.789Z"
          : timestamp.toLocaleDateString();

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

    // For last 24h, format the time labels as MM:DD:SS:SSS
    const displayLabels =
      days === 1
        ? keys.map((key) => {
            return formatTimestamp(key);
          })
        : keys;

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
      // Add data zoom for x-axis scalability
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

    // Use lazyUpdate to batch render operations
    chart.setOption(option, { notMerge: false, lazyUpdate: true });
  };

  const initApiPerformanceChart = () => {
    if (!apiPerformanceChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(apiPerformanceChartRef.current);
    if (!chart) {
      chart = echarts.init(apiPerformanceChartRef.current);
    }

    // Helper function to extract API path from full URL
    const extractApiPath = (url: string): string => {
      try {
        // If it's a full URL, extract pathname
        if (url.startsWith("http://") || url.startsWith("https://")) {
          const urlObj = new URL(url);
          return urlObj.pathname;
        }
        // Otherwise return as-is (already a path)
        return url;
      } catch {
        // Fallback: remove protocol and host manually
        return url.replace(/^https?:\/\/[^\/]+/, "");
      }
    };

    // Extract API call data from metrics - support both camelCase and lowercase
    const apiCallsData: Array<{
      url: string;
      avgDuration: number;
      successRate: number;
    }> = [];

    console.log(
      "[Analytics] Processing API performance data:",
      data.length,
      "records",
    );

    data.forEach((item, index) => {
      // Try both possible field names
      const apiCalls = item.metrics.apiCalls || item.metrics.apicalls;

      if (index === 0) {
        console.log(
          "[Analytics] First record metrics keys:",
          Object.keys(item.metrics),
        );
        console.log(
          "[Analytics] API calls found:",
          !!apiCalls,
          "Type:",
          typeof apiCalls,
        );
      }

      if (apiCalls && Array.isArray(apiCalls)) {
        if (index === 0) {
          console.log("[Analytics] API calls count:", apiCalls.length);
        }
        apiCalls.forEach((apiCall) => {
          apiCallsData.push({
            url: apiCall.url,
            avgDuration: apiCall.duration | 0,
            successRate: apiCall.success ? 100 : 0,
          });
        });
      }
    });

    console.log("[Analytics] Total API calls extracted:", apiCallsData.length);

    // Group by URL and calculate averages
    const urlStats: Record<
      string,
      { durations: number[]; successes: number[] }
    > = {};
    apiCallsData.forEach((call) => {
      // Extract clean API path for grouping
      const apiPath = extractApiPath(call.url);
      if (!urlStats[apiPath]) {
        urlStats[apiPath] = { durations: [], successes: [] };
      }
      urlStats[apiPath].durations.push(call.avgDuration);
      urlStats[apiPath].successes.push(call.successRate);
    });

    const urls = Object.keys(urlStats).slice(0, 10); // Top 10 endpoints

    console.log("[Analytics] Unique URLs:", urls.length);

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
      chart.setOption(option);
      return;
    }

    const avgDurations = urls.map((url) => {
      const stats = urlStats[url];
      return (
        (stats.durations.reduce((sum, d) => sum + d, 0) /
          stats.durations.length) |
        0
      );
    });
    const successRates = urls.map((url) => {
      const stats = urlStats[url];
      return (
        stats.successes.reduce((sum, s) => sum + s, 0) / stats.successes.length
      );
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
        data: urls.map((url) =>
          url.length > 30 ? url.substring(0, 30) + "..." : url,
        ),
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

    chart.setOption(option);
  };

  const initRoutePerformanceChart = () => {
    if (!routePerformanceChartRef.current) return;

    // Get existing chart instance or create new one
    let chart = echarts.getInstanceByDom(routePerformanceChartRef.current);
    if (!chart) {
      chart = echarts.init(routePerformanceChartRef.current);
    }

    // Extract route performance data - support both camelCase and lowercase
    const routeData: Array<{
      route: string;
      loadTime: number;
      domContentLoaded: number;
    }> = [];

    console.log("[Analytics] Processing route performance data");

    data.forEach((item, index) => {
      // Try both possible field names
      const routePerformance =
        item.metrics.routePerformance || item.metrics.routeperformance;

      if (index === 0) {
        console.log("[Analytics] Route performance found:", !!routePerformance);
        if (routePerformance) {
          console.log("[Analytics] Route performance data:", routePerformance);
        }
      }

      if (routePerformance) {
        routeData.push({
          route: routePerformance.route,
          loadTime: routePerformance.loadTime | 0,
          domContentLoaded: routePerformance.domContentLoaded | 0,
        });
      }
    });

    console.log("[Analytics] Total route records extracted:", routeData.length);

    // Group by route
    const routeStats: Record<
      string,
      { loadTimes: number[]; domContentLoadedTimes: number[] }
    > = {};
    routeData.forEach((route) => {
      if (!routeStats[route.route]) {
        routeStats[route.route] = { loadTimes: [], domContentLoadedTimes: [] };
      }
      routeStats[route.route].loadTimes.push(route.loadTime);
      routeStats[route.route].domContentLoadedTimes.push(
        route.domContentLoaded,
      );
    });

    const routes = Object.keys(routeStats);

    console.log("[Analytics] Unique routes:", routes.length);

    if (routes.length === 0) {
      // Show empty state
      const option: EChartsOption = {
        title: {
          text: "Route Performance",
          left: "center",
          textStyle: { color: "#fff" },
        },
        graphic: {
          type: "text",
          left: "center",
          top: "middle",
          style: {
            text: "No route performance data available",
            fill: "#999",
            fontSize: 16,
          },
        },
      };
      chart.setOption(option);
      return;
    }

    const avgLoadTimes = routes.map((route) => {
      const stats = routeStats[route];
      return (
        (stats.loadTimes.reduce((sum, t) => sum + t, 0) /
          stats.loadTimes.length) |
        0
      );
    });
    const avgDomContentLoaded = routes.map((route) => {
      const stats = routeStats[route];
      return (
        (stats.domContentLoadedTimes.reduce((sum, t) => sum + t, 0) /
          stats.domContentLoadedTimes.length) |
        0
      );
    });

    const option: EChartsOption = {
      title: {
        text: "Route Performance",
        left: "center",
        textStyle: { color: "#fff" },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["Load Time", "DOM Content Loaded"],
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
        data: routes,
        axisLabel: { color: "#999" },
      },
      yAxis: {
        type: "value",
        name: "Time (ms)",
        axisLabel: { color: "#999" },
        splitLine: { lineStyle: { color: "#333" } },
      },
      series: [
        {
          name: "Load Time",
          type: "bar",
          data: avgLoadTimes,
          itemStyle: { color: "#722ed1" },
        },
        {
          name: "DOM Content Loaded",
          type: "bar",
          data: avgDomContentLoaded,
          itemStyle: { color: "#13c2c2" },
        },
      ],
    };

    chart.setOption(option, { notMerge: false, lazyUpdate: true });
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading analytics data...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-4">
          Performance Analytics
        </h1>
        <div className="flex gap-2 flex-wrap">
          {[1, 7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded ${
                days === d
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {d === 1 ? "Last 24h" : `Last ${d} days`}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {data.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No analytics data available for the selected period.
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Total Records</div>
                <div className="text-2xl font-bold text-white">
                  {data.length}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg LCP</div>
                <div className="text-2xl font-bold text-blue-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.lcp?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg FCP</div>
                <div className="text-2xl font-bold text-green-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.fcp?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg CLS</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.cls?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(5)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg TTFB</div>
                <div className="text-2xl font-bold text-purple-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.ttfb?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div ref={timelineChartRef} className="w-full h-80"></div>
            </div>

            {/* Metric Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div ref={lcpChartRef} className="w-full h-64"></div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div ref={fcpChartRef} className="w-full h-64"></div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div ref={clsChartRef} className="w-full h-64"></div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div ref={ttfbChartRef} className="w-full h-64"></div>
              </div>
            </div>

            {/* API Performance Chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div ref={apiPerformanceChartRef} className="w-full h-80"></div>
            </div>

            {/* Route Performance Chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div ref={routePerformanceChartRef} className="w-full h-80"></div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
