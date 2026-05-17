/**
 * Service Worker utilities for cache management and updates
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  waitingUpdate: boolean;
}

/**
 * Check current Service Worker status
 */
export async function checkServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[SW] Service Workers not supported");
    return {
      isSupported: false,
      isRegistered: false,
      isActive: false,
      waitingUpdate: false,
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();

  const status = {
    isSupported: true,
    isRegistered: !!registration,
    isActive: !!navigator.serviceWorker.controller,
    waitingUpdate: !!registration?.waiting,
  };

  // Log diagnostic information
  if (status.isRegistered) {
    console.log("[SW] Registration found:", {
      scope: registration?.scope,
      active: registration?.active?.scriptURL,
      installing: registration?.installing?.scriptURL,
      waiting: registration?.waiting?.scriptURL,
    });
  } else {
    console.warn("[SW] No registration found - SW may not be installed yet");
  }

  if (!status.isActive) {
    console.warn("[SW] Service Worker is not active (no controller)");
    console.warn("[SW] This can happen when:");
    console.warn("[SW]   - First page load after registration");
    console.warn("[SW]   - Self-signed certificate not trusted");
    console.warn("[SW]   - Browser blocked the registration");
  }

  return status;
}

/**
 * Force Service Worker update check
 */
export async function checkForUpdates(): Promise<boolean> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (!registration) {
    console.log("[SW] No service worker registered");
    return false;
  }

  try {
    await registration.update();
    console.log("[SW] Update check completed");
    return true;
  } catch (error) {
    console.error("[SW] Update check failed:", error);
    return false;
  }
}

/**
 * Skip waiting and activate new Service Worker immediately
 */
export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();

  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    console.log("[SW] Skipping waiting...");
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log("[SW] All caches cleared");
  }
}

/**
 * Get cache usage information
 */
export async function getCacheInfo(): Promise<{
  caches: Array<{ name: string; size?: number }>;
}> {
  if (!("caches" in window)) {
    return { caches: [] };
  }

  const cacheNames = await caches.keys();
  const cacheList = await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      return {
        name,
        size: keys.length,
      };
    }),
  );

  return { caches: cacheList };
}

/**
 * Register a callback for Service Worker updates
 */
export function onServiceWorkerUpdate(callback: () => void): () => void {
  if (!("serviceWorker" in navigator)) {
    return () => {};
  }

  const handler = async () => {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration?.waiting) {
      callback();
    }
  };

  navigator.serviceWorker.addEventListener("controllerchange", handler);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener("controllerchange", handler);
  };
}

/**
 * Precache specific URLs programmatically
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  const CACHE_NAME = "app-cache-v1";
  const cache = await caches.open(CACHE_NAME);

  await cache.addAll(urls);
  console.log(`[SW] Precached ${urls.length} URLs`);
}

/**
 * Remove specific URLs from cache
 */
export async function removeFromCache(
  url: string,
  cacheName?: string,
): Promise<void> {
  const cacheToUse = cacheName || "runtime-cache-v1";
  const cache = await caches.open(cacheToUse);

  await cache.delete(url);
  console.log(`[SW] Removed from cache: ${url}`);
}
