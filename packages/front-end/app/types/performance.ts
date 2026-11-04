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
  pageUrl: string;
  userAgent: string;
  timestamp: string;
  latest_timestamp: string;
  avg_fcp: number;
  avg_lcp: number;
  avg_cls: number;
  fid: number;
  ttfb: number;
  inp: number;
  avg_duration: number;
  navigationType: string;
  connectionInfo: string;
}

export interface ApiCallData {
  id: number;
  url: string;
  path: string;
  duration: number;
  avg_duration: number;
  status: number;
  error_count: number;
  total_requests: number;
  success: boolean;
}
