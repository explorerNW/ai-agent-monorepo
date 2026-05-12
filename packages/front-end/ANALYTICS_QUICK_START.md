# Analytics Dashboard - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd packages/front-end
pnpm install
```

This will install `echarts` and all other required dependencies.

### Step 2: Start the Backend

Make sure your backend is running with track data:

```bash
cd packages/back-end
pnpm run start:dev
```

**Verify backend is accessible:**

```bash
curl http://localhost:3000/api/v1/track/web-vitals/stats?days=7
```

You should see JSON response with Web Vitals data (or empty array if no data).

### Step 3: Start the Frontend

```bash
cd packages/front-end
pnpm run dev
```

Navigate to: **http://localhost:3001/analytics**

## 📊 What You'll See

### Dashboard Layout

```
┌─────────────────────────────────────┐
│  Performance Analytics              │
│  [Last 7 days] [14 days] [30 days]  │
│  [Refresh]                          │
├─────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │Total │ │Avg   │ │Avg   │ │Avg │ │
│  │Records│ │LCP  │ │FCP   │ │CLS │ │
│  └──────┘ └──────┘ └──────┘ └────┘ │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Performance Trends Chart   │   │
│  │  (Line chart over time)     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ LCP  │ │ FCP  │ │ CLS  │       │
│  │Dist. │ │Dist. │ │Dist. │       │
│  └──────┘ └──────┘ └──────┘       │
└─────────────────────────────────────┘
│  [Feed] [Explore] [Analytics] ...  │
└─────────────────────────────────────┘
```

## 🎯 Using the Dashboard

### Filter by Time Range

- Click **"Last 24h"**, **"Last 7 days"**, **"Last 14 days"**, or **"Last 30 days"**
- Charts automatically update with new data

### Refresh Data

- Click the **"Refresh"** button to reload latest data from backend

### Navigate

- Use bottom navigation to switch between pages
- Analytics icon shows as active when on `/analytics` route

## 🔍 Understanding the Charts

### 1. Timeline Chart (Top)

Shows performance trends over time with three lines:

- **Blue line**: LCP (ms) - left axis
- **Green line**: FCP (ms) - left axis
- **Yellow line**: CLS - right axis

**What to look for:**

- Downward trend = improving performance ✅
- Upward trend = degrading performance ⚠️
- Spikes indicate specific issues

### 2. LCP Distribution (Bottom Left)

Bar chart showing how many page loads fall into each category:

- **Green bar**: Good (≤2.5s) - Target: majority here
- **Yellow bar**: Needs Improvement (2.5-4s)
- **Red bar**: Poor (>4s) - Investigate these

### 3. FCP Distribution (Bottom Center)

Same format as LCP but for First Contentful Paint:

- **Green**: ≤1.8s
- **Yellow**: 1.8-3s
- **Red**: >3s

### 4. CLS Distribution (Bottom Right)

Layout shift distribution:

- **Green**: ≤0.1 (stable)
- **Yellow**: 0.1-0.25
- **Red**: >0.25 (janky)

## 📈 Interpreting Results

### Good Performance Indicators ✅

- Most bars in green zones
- Timeline trending downward
- Low average values in summary cards

### Warning Signs ⚠️

- Significant yellow/red bars
- Upward trends in timeline
- High averages (>2.5s LCP, >1.8s FCP, >0.1 CLS)

### Action Items 🔧

If you see poor performance:

1. Check specific URLs with worst metrics
2. Look at timestamps to identify when issues started
3. Correlate with recent deployments or changes
4. Investigate large assets, slow APIs, or layout shifts

## 🐛 Troubleshooting

### "No analytics data available"

**Problem**: Empty dashboard  
**Solutions**:

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check if track data exists in database
3. Ensure frontend can reach backend (check CORS)
4. Open browser DevTools → Network tab → check API call

### Charts not rendering

**Problem**: Blank chart areas  
**Solutions**:

1. Check browser console for errors
2. Verify echarts installed: `pnpm list echarts`
3. Try refreshing the page
4. Check if container has proper dimensions

### API request fails

**Problem**: Error message displayed  
**Solutions**:

1. Check backend URL in `.env`: `VITE_API_BASE_URL`
2. Verify backend CORS includes frontend origin
3. Check browser console for CORS errors
4. Test endpoint directly: `curl http://localhost:3000/api/v1/track/web-vitals/stats`

### Navigation not working

**Problem**: Can't access analytics page  
**Solutions**:

1. Verify route exists in `app/routes.ts`
2. Check for TypeScript compilation errors
3. Restart dev server: `Ctrl+C` then `pnpm run dev`
4. Clear browser cache

## 💡 Pro Tips

### Keyboard Shortcuts

- `Cmd+R` / `Ctrl+R`: Refresh data
- `Cmd+Shift+R`: Hard refresh page

### Browser DevTools

- **Network tab**: Monitor API requests
- **Console tab**: Check for errors
- **Elements tab**: Inspect chart DOM
- **Performance tab**: Measure dashboard render time

### Data Analysis

1. **Compare periods**: Switch between 24h/7/14/30 days to spot trends
2. **Identify outliers**: Look for red bars in distributions
3. **Correlate metrics**: High LCP often means high FCP too
4. **Track improvements**: Watch timeline after optimizations

## 🎓 Learning Resources

### Web Vitals

- [Web.dev - Core Web Vitals](https://web.dev/vitals/)
- [Google - Understanding Web Vitals](https://web.dev/articles/vitals)

### ECharts

- [ECharts Official Docs](https://echarts.apache.org/en/index.html)
- [ECharts Examples Gallery](https://echarts.apache.org/examples/en/index.html)

### Performance Optimization

- [Web.dev - Fast Load Times](https://web.dev/fast/)
- [MDN - Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

## 📞 Need Help?

Check these files for more details:

- `ANALYTICS_DASHBOARD.md` - Complete implementation guide
- `ANALYTICS_IMPLEMENTATION_SUMMARY.md` - Technical summary
- Browser console - Runtime errors and warnings
- Backend logs - API request details

## ✨ Next Steps

Once you're comfortable with the basics:

1. Explore different time ranges
2. Identify performance bottlenecks
3. Implement optimizations
4. Track improvements over time
5. Consider adding custom filters or alerts

Happy analyzing! 📊🚀
