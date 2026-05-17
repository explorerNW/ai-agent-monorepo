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
    console.log("[SW] ✅ Registration found:", {
      scope: registration?.scope,
      active: registration?.active?.scriptURL,
      installing: registration?.installing?.scriptURL,
      waiting: registration?.waiting?.scriptURL,
    });

    // If registered but not active yet, it's likely still installing
    if (!status.isActive && registration?.installing) {
      console.log(
        "[SW] ⏳ Service Worker is installing... Please wait or refresh the page.",
      );
    }
  } else {
    // Only warn if we're confident it should have been registered
    const hasVisitedBefore = localStorage.getItem("sw_visited");

    if (hasVisitedBefore) {
      console.warn(
        "[SW] ⚠️ No registration found on repeat visit - SW may have failed to install",
      );
    } else {
      console.log(
        "[SW] ℹ️ No registration found - this is normal on first visit",
      );
      console.log("[SW] Service Worker will be registered shortly...");
      // Mark that user has visited
      localStorage.setItem("sw_visited", "true");
    }
  }

  if (!status.isActive) {
    // Provide helpful context based on environment
    const isHTTPS = window.location.protocol === "https:";
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isHTTPS && !isLocalhost) {
      console.warn("[SW] ⚠️ Warning: Service Workers require HTTPS");
      console.warn("[SW] Current protocol:", window.location.protocol);
    } else if (isHTTPS && !isLocalhost) {
      // For custom domains with HTTPS, provide specific guidance
      if (!status.isRegistered) {
        console.warn("[SW] Running on HTTPS with custom domain");
        console.warn(
          "[SW] If Service Worker fails to register, you may need to:",
        );
        console.warn("[SW]   1. Visit the site URL directly in a new tab");
        console.warn("[SW]   2. Accept any security warnings");
        console.warn("[SW]   3. Refresh this page");
        console.warn(
          "[SW] Note: Some browsers restrict SW on self-signed certs for non-localhost domains",
        );
      }
    } else {
      // Localhost - usually just needs a moment to install
      console.log(
        "[SW] ℹ️ Service Worker may still be activating (normal on first load)",
      );
      console.log("[SW] Try refreshing the page if features don't work");
    }
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
