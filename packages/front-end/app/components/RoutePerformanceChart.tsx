import { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, EChartsType } from 'echarts';
import type { WebVitalsData } from '~/types/performance';

interface RoutePerformanceChartProps {
  data: WebVitalsData[];
}

function RoutePerformanceChart({ data }: RoutePerformanceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    let chart = echarts.getInstanceByDom(chartRef.current) as EChartsType;
    if (!chart) {
      chart = echarts.init(chartRef.current);
    }
    // Extract route performance data with FCP and LCP
    const routeData: Array<{
      route: string;
      fcp: number | null;
      lcp: number | null;
    }> = [];

    data.forEach((item) => {
      const routePerformance = item.metrics.routePerformance;

      if (routePerformance) {
        routeData.push({
          route: routePerformance.route,
          fcp: routePerformance.fcp ?? null,
          lcp: routePerformance.lcp ?? null,
        });
      }
    });

    // Group by route
    const routeStats: Record<string, { fcpValues: number[]; lcpValues: number[] }> = {};
    routeData.forEach((route) => {
      if (!routeStats[route.route]) {
        routeStats[route.route] = { fcpValues: [], lcpValues: [] };
      }
      if (route.fcp !== null) {
        routeStats[route.route].fcpValues.push(route.fcp);
      }
      if (route.lcp !== null) {
        routeStats[route.route].lcpValues.push(route.lcp);
      }
    });

    const routes = Object.keys(routeStats);

    if (routes.length === 0) {
      // Show empty state
      const option: EChartsOption = {
        title: {
          text: 'Route Performance',
          left: 'center',
          textStyle: { color: '#fff' },
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'No route performance data available',
            fill: '#999',
            fontSize: 16,
          },
        },
      };
      chart?.setOption(option, { notMerge: false, lazyUpdate: true });
      return;
    }

    const avgFcp = routes.map((route) => {
      const stats = routeStats[route];
      if (stats.fcpValues.length === 0) return 0;
      return Math.round(stats.fcpValues.reduce((sum, t) => sum + t, 0) / stats.fcpValues.length);
    });

    const avgLcp = routes.map((route) => {
      const stats = routeStats[route];
      if (stats.lcpValues.length === 0) return 0;
      return Math.round(stats.lcpValues.reduce((sum, t) => sum + t, 0) / stats.lcpValues.length);
    });

    const option: EChartsOption = {
      title: {
        text: 'Route Performance',
        left: 'center',
        textStyle: { color: '#fff' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          if (Array.isArray(params)) {
            const route =
              (params[0] as (typeof params)[0] & { axisValue?: string })?.axisValue || '';

            let result = `<strong>${route}</strong><br/>`;
            params.forEach((param) => {
              // TooltipMarker = string | RichTextTooltipMarker；富文本时取其 content 字段
              const marker =
                typeof param.marker === 'string' ? param.marker : (param.marker?.content ?? '');
              // 系列数据为 number/string；Date、对象、数组等无法安全字符串化，回退为 'N/A'
              const value =
                typeof param.value === 'number' || typeof param.value === 'string'
                  ? param.value
                  : 'N/A';
              result += `${marker} ${param.seriesName}: ${value}ms<br/>`;
            });
            return result;
          }
          return '';
        },
      },
      legend: {
        data: ['FCP', 'LCP'],
        textStyle: { color: '#ede9e9' },
        top: 30,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
        top: 70,
      },
      xAxis: {
        type: 'category',
        data: routes,
        axisLabel: {
          color: '#999',
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Time (ms)',
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#333' } },
      },
      series: [
        {
          name: 'FCP',
          type: 'bar',
          data: avgFcp,
          itemStyle: { color: '#52c41a' },
        },
        {
          name: 'LCP',
          type: 'bar',
          data: avgLcp,
          itemStyle: { color: '#fa8c16' },
        },
      ],
    };

    chart?.setOption(option, { notMerge: false, lazyUpdate: true });

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}

export default RoutePerformanceChart;
