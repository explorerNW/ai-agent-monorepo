import { useQuery } from '@tanstack/react-query';
import { getWebVitalsStats } from '~/services/api';
import type { WebVitalsData } from '~/types/performance';

export function useWebVitalsStats(days: number) {
  return useQuery<WebVitalsData[]>({
    queryKey: ['web-vitals-stats', days],
    queryFn: () => getWebVitalsStats(days),
  });
}
