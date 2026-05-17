// Development Service Worker - Simple passthrough for testing
// This file is only used in development mode
/// <reference lib="webworker" />

// Install event
self.addEventListener("install", () => {
  console.log("[SW-DEV] Installed");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", () => {
  console.log("[SW-DEV] Activated");
  self.clients.claim();
});

// Fetch event - just pass through to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Simple passthrough - no caching in dev
  event.respondWith(fetch(event.request));
});

export {};
