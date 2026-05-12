# Analytics Dashboard with ECharts

## Overview

This document describes the implementation of the analytics dashboard that queries track data from the backend and visualizes it using ECharts.

## Features

- **Real-time Data Querying**: Fetches Web Vitals performance metrics from the backend API
- **Interactive Charts**: Multiple chart types showing different aspects of performance data
- **Time Range Selection**: Filter data by last 24 hours, 7, 14, or 30 days
- **Responsive Design**: Mobile-first design with bottom navigation integration
- **Multiple Metrics Visualization**:
  - LCP (Largest Contentful Paint) distribution
  - FCP (First Contentful Paint) distribution
  - CLS (Cumulative Layout Shift) distribution
  - Performance trends over time

## Implementation Details

### 1. Dependencies

Added `echarts` package for chart visualization:

```bash
pnpm add echarts
```

### 2. API Integration

**File**: `app/services/api.ts`

Added TypeScript interfaces and API function:

- `WebVitalsMetric`: Individual metric structure
- `WebVitalsData`: Complete Web Vitals record
- `getWebVitalsStats()`: Function to query backend API

The API endpoint used:

```
GET /api/v1/track/web-vitals/stats?days={days}&url={url}
```

### 3. Analytics Dashboard Page

**File**: `app/routes/analytics.tsx`

Key components:

- **State Management**: Uses React hooks (`useState`, `useEffect`) for data fetching and chart initialization
- **Chart Initialization**: Creates ECharts instances in `useEffect` hooks
- **Resource Cleanup**: Properly disposes charts on component unmount to prevent memory leaks
- **Loading States**: Shows loading indicator while fetching data
- **Error Handling**: Displays error messages if data fetch fails

#### Charts Implemented:

1. **Timeline Chart**: Line chart showing performance trends over time with dual Y-axes
   - Left axis: Time-based metrics (LCP, FCP in ms)
   - Right axis: CLS (dimensionless)

2. **LCP Distribution**: Bar chart showing LCP rating distribution
   - Green: Good (≤2.5s)
   - Yellow: Needs Improvement (2.5-4s)
   - Red: Poor (>4s)

3. **FCP Distribution**: Bar chart showing FCP rating distribution
   - Green: Good (≤1.8s)
   - Yellow: Needs Improvement (1.8-3s)
   - Red: Poor (>3s)

4. **CLS Distribution**: Bar chart showing CLS rating distribution
   - Green: Good (≤0.1)
   - Yellow: Needs Improvement (0.1-0.25)
   - Red: Poor (>0.25)

### 4. Navigation Integration

**File**: `app/components/BottomNavigation.tsx`

- Added "Analytics" navigation item with custom icon
- Integrated with React Router's `Link` component
- Active state highlighting based on current route

### 5. Route Configuration

**File**: `app/routes.ts`

Added new route:

```typescript
route("analytics", "routes/analytics.tsx");
```

Accessible at: `/analytics`

## Usage

### Accessing the Dashboard

1. Navigate to the application
2. Click on the "Analytics" icon in the bottom navigation bar
3. Select time range (7, 14, or 30 days)
4. View performance metrics and trends

### Refreshing Data

Click the "Refresh" button to reload the latest data from the backend.

## Technical Best Practices

### ECharts Integration Pattern

```typescript
// 1. Create ref for chart container
const chartRef = useRef<HTMLDivElement>(null);

// 2. Initialize chart in useEffect
useEffect(() => {
  if (!chartRef.current) return;
  const chart = echarts.init(chartRef.current);
  chart.setOption(option);
}, [data]);

// 3. Cleanup on unmount
useEffect(() => {
  return () => {
    if (chartRef.current) {
      const chart = echarts.getInstanceByDom(chartRef.current);
      chart?.dispose();
    }
  };
}, []);
```

### Data Processing

The dashboard processes raw Web Vitals data to calculate:

- Average values for each metric
- Distribution counts by rating category
- Daily averages for timeline visualization

### Color Coding

Consistent color scheme across all charts:

- **#52c41a** (Green): Good performance
- **#faad14** (Yellow): Needs improvement
- **#ff4d4f** (Red): Poor performance

## Backend Requirements

The backend must provide the following endpoint:

```
GET /api/v1/track/web-vitals/stats
Query Parameters:
  - days (optional): Number of days to query (default: 7)
  - url (optional): Filter by URL pattern

Response: Array of WebVitalsData objects
```

See `packages/back-end/src/analysis/analytics.controller.ts` for implementation details.

## Future Enhancements

Potential improvements:

1. Add more metric types (FID, TTFB distributions)
2. Implement data export functionality
3. Add URL filtering dropdown
4. Real-time data updates with WebSocket
5. Comparative analysis between different time periods
6. Custom date range picker
7. Alert thresholds configuration
8. User segmentation analysis

## Troubleshooting

### Charts Not Rendering

1. Verify echarts is installed: `pnpm list echarts`
2. Check browser console for errors
3. Ensure chart container has proper dimensions (width/height)
4. Verify data is being fetched correctly

### No Data Displayed

1. Check backend API is running and accessible
2. Verify environment variables are configured correctly
3. Check browser network tab for API request status
4. Ensure there is track data in the database

### Performance Issues

1. Limit data points for large datasets
2. Use data zoom for timeline charts with many points
3. Consider server-side aggregation for historical data
4. Implement virtual scrolling for long lists
