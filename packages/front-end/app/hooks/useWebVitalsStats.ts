import { useQuery } from '@tanstack/react-query';
import { getApiPerformance, getWebVitalsStats } from '@/services/api';
import { queryKeys } from '@shared/api/queryKeys';
import type { ApiCallData, WebVitalsData } from '@/types/performance';

export function useWebVitalsStats(days: number) {
  return useQuery<WebVitalsData[]>({
    queryKey: queryKeys.webVitalsStats.days(days),
    queryFn: async () => {
      const res = await getWebVitalsStats(days);
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res.json();
    },
    // ✅ 仅对非 4xx 错误重试，404 立即停止重试
    retry: (failureCount, error) => {
      if ((error as Error & { response: { status: number } })?.response?.status === 404)
        return false;
      return failureCount < 3;
    },
  });
}

export function useApiPerformanceStats(days: number) {
  return useQuery<ApiCallData[]>({
    queryKey: queryKeys.apiPerformanceStats.days(days),
    queryFn: async () => {
      const res = await getApiPerformance(days);
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res.json();
    },
  });
}
