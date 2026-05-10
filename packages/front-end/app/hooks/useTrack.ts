import { useCallback } from "react";
import analyticsInstance from "../core/instance"; // 导出上面的 SDK 单例

// 通用埋点 Hook
export const useTrack = (eventName: string) => {
  return useCallback(
    (properties?: Record<string, any>) => {
      analyticsInstance.track(eventName, properties);
    },
    [eventName],
  );
};

// 页面浏览埋点 Hook (配合 react-router-dom)
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const usePageView = () => {
  const location = useLocation();
  const trackPage = useTrack("page_view");

  useEffect(() => {
    trackPage({ path: location.pathname, title: document.title });
  }, [location, trackPage]);
};
