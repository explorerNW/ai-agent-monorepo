import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router";
import { analyticsInstance } from "~/core/instance";

/**
 * Custom hook to track route performance
 * Automatically tracks page load metrics when route changes
 */
export function useRoutePerformance() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Mark route change start for SPA navigation timing
    analyticsInstance.markRouteChangeStart();

    // Delay tracking to ensure page is fully loaded
    const timer = setTimeout(() => {
      analyticsInstance.trackRoutePerformance(location.pathname);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, navigationType]);
}
