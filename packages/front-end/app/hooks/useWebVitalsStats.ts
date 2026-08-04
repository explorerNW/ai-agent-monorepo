import { useQuery } from '@tanstack/react-query';
import { getWebVitalsStats } from '~/services/api';
import type { WebVitalsData } from '~/types/performance';

export function useWebVitalsStats(days: number) {
  return useQuery<WebVitalsData[]>({
    queryKey: ['web-vitals-stats', days],
    queryFn: async () => {
      const res = await getWebVitalsStats(days);
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
