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
  avg_fcp: number;
  avg_lcp: number;
  avg_cls: number;
  fid: number;
  ttfb: number;
  inp: number;
  navigationType: string;
  connectionInfo: string;
}

export interface ApiCallData {
  id: number;
  url: string;
  duration: number;
  status: number;
  success: boolean;
}
