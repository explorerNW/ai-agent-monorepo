import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";
import { analyticsInstance } from "~/core/instance";

/**
 * Custom hook to track route performance using FCP and LCP metrics
 * Measures First Contentful Paint and Largest Contentful Paint for accurate performance tracking
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

  // Helper function to get FCP value using PerformanceObserver
  const getFCPValue = (): Promise<number | null> => {
    return new Promise((resolve) => {
      if (typeof performance === "undefined") {
        resolve(null);
        return;
      }

      try {
        // First, try to get existing FCP entries
        const paintEntries = performance.getEntriesByType("paint");
        const fcpEntry = paintEntries.find(
          (entry) => entry.name === "first-contentful-paint",
        );

        if (fcpEntry) {
          resolve(fcpEntry.startTime);
          return;
        }

        // For SPA navigation, FCP might not be available yet
        // Use a timeout to wait for FCP to be measured
        const timeoutId = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 2000); // Wait up to 2 seconds for FCP

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(
            (entry) => entry.name === "first-contentful-paint",
          );

          if (fcpEntry) {
            clearTimeout(timeoutId);
            observer.disconnect();
            resolve(fcpEntry.startTime);
          }
        });

        observer.observe({ type: "paint", buffered: true });
      } catch (e) {
        console.warn("[useRoutePerformance] FCP observer setup failed:", e);
        resolve(null);
      }
    });
  };

  // Helper function to get LCP value using PerformanceObserver
  const getLCPValue = (): Promise<number | null> => {
    return new Promise((resolve) => {
      if (typeof performance === "undefined") {
        resolve(null);
        return;
      }

      try {
        // First, try to get existing LCP entries
        const lcpEntries = performance.getEntriesByType(
          "largest-contentful-paint",
        );
        if (lcpEntries.length > 0) {
          resolve(lcpEntries[lcpEntries.length - 1].startTime);
          return;
        }

        // For SPA navigation, LCP might not be available yet
        // Use a timeout to wait for LCP to be measured
        const timeoutId = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 3000); // Wait up to 3 seconds for LCP

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            clearTimeout(timeoutId);
            const lastEntry = entries[entries.length - 1];
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });

        observer.observe({ type: "largest-contentful-paint", buffered: true });
      } catch (e) {
        console.warn("[useRoutePerformance] LCP observer setup failed:", e);
        resolve(null);
      }
    });
  };

  // Measure and report performance AFTER route has rendered
  useEffect(() => {
    // Skip tracking on initial mount - handled by separate effect below
    if (isInitialLoadRef.current) {
      return;
    }

    // For SPA navigation, measure after React commits DOM
    // Use requestAnimationFrame + microtask to ensure DOM is painted
    let animationFrameId: number;

    const measurePerformance = async () => {
      if (
        routeChangeStartRef.current !== null &&
        typeof performance !== "undefined"
      ) {
        const endTime = performance.now();

        // Get FCP value (asynchronous)
        const fcp = await getFCPValue();

        // Get LCP value (asynchronous with timeout)
        const lcp = await getLCPValue();

        console.log(
          `[useRoutePerformance] SPA route "${location.pathname}" - FCP: ${fcp?.toFixed(2) ?? "N/A"}ms, LCP: ${lcp?.toFixed(2) ?? "N/A"}ms`,
        );

        // Track the performance with FCP and LCP metrics
        analyticsInstance.trackRoutePerformanceWithMetrics(location.pathname, {
          fcp,
          lcp,
          startTime: routeChangeStartRef.current,
          endTime,
        });

        // Reset for next navigation
        routeChangeStartRef.current = null;
      }
    };

    // Schedule measurement after paint
    animationFrameId = requestAnimationFrame(() => {
      measurePerformance().catch((error) => {
        console.error("[useRoutePerformance] Measurement error:", error);
      });
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [location.pathname, navigationType]);

  // Handle initial page load using native browser events
  useEffect(() => {
    if (isInitialLoadRef.current) {
      const handleLoadOrReady = async () => {
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;

          // Get FCP value (asynchronous)
          const fcp = await getFCPValue();

          // Get LCP value (asynchronous with timeout)
          const lcp = await getLCPValue();

          console.log(
            `[useRoutePerformance] Initial load "${location.pathname}" - FCP: ${fcp?.toFixed(2) ?? "N/A"}ms, LCP: ${lcp?.toFixed(2) ?? "N/A"}ms`,
          );

          analyticsInstance.trackRoutePerformanceWithMetrics(
            location.pathname,
            {
              fcp,
              lcp,
              startTime: 0,
              endTime: performance.now(),
            },
          );
        }
      };

      if (document.readyState === "complete") {
        // Page already loaded
        handleLoadOrReady().catch((error) => {
          console.error(
            "[useRoutePerformance] Initial load measurement error:",
            error,
          );
        });
      } else {
        // Wait for page load event
        window.addEventListener("load", () => {
          handleLoadOrReady().catch((error) => {
            console.error(
              "[useRoutePerformance] Initial load measurement error:",
              error,
            );
          });
        });
        return () => window.removeEventListener("load", handleLoadOrReady);
      }
    }
  }, [location.pathname]);
}
