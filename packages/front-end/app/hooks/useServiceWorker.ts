import { useState, useEffect, useCallback } from "react";
import {
  checkServiceWorkerStatus,
  checkForUpdates,
  skipWaiting as swSkipWaiting,
  getCacheInfo,
  onServiceWorkerUpdate,
  type ServiceWorkerStatus,
} from "../utils/serviceWorker";

interface UseServiceWorkerReturn {
  status: ServiceWorkerStatus;
  isLoading: boolean;
  error: Error | null;
  checkForUpdates: () => Promise<void>;
  skipWaiting: () => Promise<void>;
  refreshCache: () => Promise<void>;
  hasUpdate: boolean;
}

/**
 * Hook for managing Service Worker lifecycle and updates
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isActive: false,
    waitingUpdate: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  // Check initial status
  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        setIsLoading(true);
        const currentStatus = await checkServiceWorkerStatus();

        if (mounted) {
          setStatus(currentStatus);
          setHasUpdate(currentStatus.waitingUpdate);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to check SW status"),
          );
          setIsLoading(false);
        }
      }
    };

    checkStatus();

    // Listen for updates
    const cleanup = onServiceWorkerUpdate(() => {
      if (mounted) {
        setHasUpdate(true);
        console.log("[SW] New version available");
      }
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  // Check for updates manually
  const handleCheckForUpdates = useCallback(async () => {
    try {
      const updated = await checkForUpdates();
      if (updated) {
        const newStatus = await checkServiceWorkerStatus();
        setStatus(newStatus);
        setHasUpdate(newStatus.waitingUpdate);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to check for updates"),
      );
    }
  }, []);

  // Skip waiting to activate new SW
  const handleSkipWaiting = useCallback(async () => {
    try {
      await swSkipWaiting();
      // Reload page to activate new SW
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to skip waiting"),
      );
    }
  }, []);

  // Refresh cache
  const handleRefreshCache = useCallback(async () => {
    try {
      const cacheInfo = await getCacheInfo();
      console.log("[SW] Current cache info:", cacheInfo);

      // Force update check
      await handleCheckForUpdates();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to refresh cache"),
      );
    }
  }, [handleCheckForUpdates]);

  return {
    status,
    isLoading,
    error,
    checkForUpdates: handleCheckForUpdates,
    skipWaiting: handleSkipWaiting,
    refreshCache: handleRefreshCache,
    hasUpdate,
  };
}
