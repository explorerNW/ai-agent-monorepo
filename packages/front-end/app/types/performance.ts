export interface WebVitalsMetric {
  value: number;
  rating: string;
  navigationType?: string;
}

export interface ApiCallMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  success: boolean;
}

export interface RoutePerformanceMetric {
  route: string;
  fcp?: number | null;
  lcp?: number | null;
  duration?: number;
  navigationType: string;
}

export interface WebVitalsData {
  id: number;
  eventName: string;
  userId?: string;
  url: string;
  metrics: {
    lcp?: WebVitalsMetric;
    fcp?: WebVitalsMetric;
    cls?: WebVitalsMetric;
    fid?: WebVitalsMetric;
    ttfb?: WebVitalsMetric;
    apiCalls?: ApiCallMetric[];
    routePerformance?: RoutePerformanceMetric;
  };
  navigationType?: string;
  timestamp: string;
  createdAt: string;
}
