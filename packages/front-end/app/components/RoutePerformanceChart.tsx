import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import type { WebVitalsData } from "~/types/performance";

interface RoutePerformanceChartProps {
  data: WebVitalsData[];
}

export function RoutePerformanceChart({ data }: RoutePerformanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    let chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }

    // Extract route performance data
    const routeData: Array<{
      route: string;
      loadTime: number;
      domContentLoaded: number;
    }> = [];

    data.forEach((item) => {
      const routePerformance = item.metrics.routePerformance;

      if (routePerformance) {
        routeData.push({
          route: routePerformance.route,
          loadTime: routePerformance.loadTime,
          domContentLoaded: routePerformance.domContentLoaded,
        });
      }
    });

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
      chart.setOption(option, { notMerge: false, lazyUpdate: true });
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

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
