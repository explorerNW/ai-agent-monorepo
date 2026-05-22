import type { Route } from "./+types/home";
import { usePageView } from "~/hooks/useTrack";
import FeedPage from "./feed";
import { useEffect, useRef, useState } from "react";
import React from "react";
import BottomNavigation from "~/components/BottomNavigation";
import { initPerformanceMonitoring } from "~/core/performance-sdk";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Infinite Feed" },
    { name: "description", content: "Social media feed interface" },
  ];
}

export default function Home() {
  // 页面浏览埋点 - 必须在顶层调用
  usePageView();
  const ref = useRef<{ init: boolean }>({ init: false });

  useEffect(() => {
    if (ref.current.init) return;
    console.log("init performance monitoring");
    initPerformanceMonitoring("/api/performance");
    ref.current.init = true;
  }, []);

  const [activeTab, setActiveTab] = useState<string>("feed");

  // Memoize handler to prevent unnecessary re-renders in child components
  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Content section - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <FeedPage />
      </div>

      {/* Bottom Navigation - fixed at bottom */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
