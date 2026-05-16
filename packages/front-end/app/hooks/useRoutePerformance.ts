import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";
import { analyticsInstance } from "~/core/instance";

/**
 * Custom hook to track route performance
 * Accurately measures page load and SPA navigation timing
 */
export function useRoutePerformance() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathnameRef = useRef<string>("");
  const isInitialLoadRef = useRef<boolean>(true);
  const routeChangeStartRef = useRef<number | null>(null);

  // Track route change start time BEFORE React renders new route
  useEffect(() => {
    const currentPathname = location.pathname;
    const previousPathname = previousPathnameRef.current;

    // Only track if route actually changed
    if (
      currentPathname !== previousPathname &&
      typeof performance !== "undefined"
    ) {
      // Record start time immediately when effect runs (before render completes)
      routeChangeStartRef.current = performance.now();

      // Mark for Performance API
      analyticsInstance.markRouteChangeStart(currentPathname);

      // Update previous pathname
      previousPathnameRef.current = currentPathname;
    }
  }, [location.pathname]);

  // Measure and report performance AFTER route has rendered
  useEffect(() => {
    // Skip tracking on initial mount - handled by separate effect below
    if (isInitialLoadRef.current) {
      return;
    }

    // For SPA navigation, measure after React commits DOM
    // Use requestAnimationFrame + microtask to ensure DOM is painted
    let animationFrameId: number;

    const measurePerformance = () => {
      Promise.resolve().then(() => {
        if (
          routeChangeStartRef.current !== null &&
          typeof performance !== "undefined"
        ) {
          const endTime = performance.now();
          const duration = endTime - routeChangeStartRef.current;

          console.log(
            `[useRoutePerformance] SPA route "${location.pathname}" rendered in ${duration.toFixed(2)}ms`,
          );

          // Track the performance
          analyticsInstance.trackRoutePerformance(location.pathname);

          // Reset for next navigation
          routeChangeStartRef.current = null;
        }
      });
    };

    // Schedule measurement after paint
    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [location.pathname, navigationType]);

  // Handle initial page load using native browser events
  useEffect(() => {
    if (isInitialLoadRef.current) {
      const handleLoadOrReady = () => {
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          analyticsInstance.trackRoutePerformance(location.pathname);
        }
      };

      if (document.readyState === "complete") {
        // Page already loaded
        handleLoadOrReady();
      } else {
        // Wait for page load event
        window.addEventListener("load", handleLoadOrReady);
        return () => window.removeEventListener("load", handleLoadOrReady);
      }
    }
  }, [location.pathname]);
}
