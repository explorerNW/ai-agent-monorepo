// Service Worker for PWA with advanced caching strategies
/// <reference lib="webworker" />

const CACHE_NAME = "app-cache-v1";
const RUNTIME_CACHE = "runtime-cache-v1";

// Precache manifest - will be replaced by Vite plugin during build
const PRECACHE_MANIFEST: { url: string; revision: string }[] =
  []; /* __PRECACHE_MANIFEST__ */

// URLs to precache
const PRECACHE_URLS = PRECACHE_MANIFEST.map((item) => item.url);

declare const self: ServiceWorkerGlobalScope;

// Install event - precache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching app shell");
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // API requests - Network First strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache First strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - Stale While Revalidate strategy
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default - Network First
  event.respondWith(networkFirstStrategy(request));
});

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log("[SW] Cache hit:", request.url);
    return cachedResponse;
  }

  console.log("[SW] Cache miss, fetching:", request.url);
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Network First Strategy - for API calls
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      console.log("[SW] Network success:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for API
    return new Response(
      JSON.stringify({ error: "You are offline", offline: true }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Stale While Revalidate Strategy - for HTML pages
async function staleWhileRevalidateStrategy(
  request: Request,
): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  // Fetch in background (don't wait)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        console.log("[SW] Updated cache:", request.url);
      }
      return networkResponse;
    })
    .catch(() => {
      console.log("[SW] Background fetch failed:", request.url);
      return null;
    });

  // Return cached response immediately, or wait for network
  return (
    cachedResponse ||
    (await fetchPromise) ||
    new Response("Offline", { status: 503 })
  );
}

// Helper to check if URL is a static asset
function isStaticAsset(pathname: string): boolean {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".ico",
    ".webp",
  ];

  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Message handler for cache management
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      }),
    );
  }
});

export {};
