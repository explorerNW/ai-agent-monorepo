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
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
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
    apicalls?: ApiCallMetric[]; // Support lowercase from database
    routePerformance?: RoutePerformanceMetric;
    routeperformance?: RoutePerformanceMetric; // Support lowercase from database
  };
  navigationType?: string;
  timestamp: string;
  createdAt: string;
}
