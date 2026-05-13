import { useEffect, useRef, useState } from "react";
import { getWebVitalsStats } from "~/services/api";
import { BottomNavigation } from "~/components/BottomNavigation";
import {
  DistributionChart,
  TimelineChart,
  ApiPerformanceChart,
  RoutePerformanceChart,
} from "~/components";
import type { WebVitalsData } from "~/types/performance";

export default function Analytics() {
  const [data, setData] = useState<WebVitalsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  // Fetch data on component mount or when days changes
  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getWebVitalsStats(days);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading analytics data...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-4">
          Performance Analytics
        </h1>
        <div className="flex gap-2 flex-wrap">
          {[1, 7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded ${
                days === d
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {d === 1 ? "Last 24h" : `Last ${d} days`}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {data.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No analytics data available for the selected period.
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Total Records</div>
                <div className="text-2xl font-bold text-white">
                  {data.length}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg LCP</div>
                <div className="text-2xl font-bold text-blue-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.lcp?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg FCP</div>
                <div className="text-2xl font-bold text-green-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.fcp?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg CLS</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.cls?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(5)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Avg TTFB</div>
                <div className="text-2xl font-bold text-purple-400">
                  {(
                    data.reduce(
                      (sum, item) => sum + (item.metrics.ttfb?.value || 0),
                      0,
                    ) / data.length
                  ).toFixed(0)}
                  ms
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <TimelineChart data={data} days={days} />
            </div>

            {/* Metric Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <DistributionChart
                  data={data}
                  title="LCP Distribution"
                  metricKey="lcp"
                  thresholds={{
                    good: 2500,
                    needsImprovement: 4000,
                    labels: [
                      "Good (≤2.5s)",
                      "Needs Improvement (2.5-4s)",
                      "Poor (>4s)",
                    ],
                  }}
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <DistributionChart
                  data={data}
                  title="FCP Distribution"
                  metricKey="fcp"
                  thresholds={{
                    good: 1800,
                    needsImprovement: 3000,
                    labels: [
                      "Good (≤1.8s)",
                      "Needs Improvement (1.8-3s)",
                      "Poor (>3s)",
                    ],
                  }}
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <DistributionChart
                  data={data}
                  title="CLS Distribution"
                  metricKey="cls"
                  thresholds={{
                    good: 0.1,
                    needsImprovement: 0.25,
                    labels: [
                      "Good (≤0.1)",
                      "Needs Improvement (0.1-0.25)",
                      "Poor (>0.25)",
                    ],
                  }}
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <DistributionChart
                  data={data}
                  title="TTFB Distribution"
                  metricKey="ttfb"
                  thresholds={{
                    good: 800,
                    needsImprovement: 1800,
                    labels: [
                      "Good (≤800ms)",
                      "Needs Improvement (800-1800ms)",
                      "Poor (>1800ms)",
                    ],
                  }}
                />
              </div>
            </div>

            {/* API Performance Chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <ApiPerformanceChart data={data} />
            </div>

            {/* Route Performance Chart */}
            <div className="bg-gray-900 rounded-lg p-4">
              <RoutePerformanceChart data={data} />
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
