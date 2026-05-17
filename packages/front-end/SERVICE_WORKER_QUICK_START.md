# Service Worker Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Build the Project

```bash
cd packages/front-end
pnpm build
```

The Vite plugin will automatically:

- ✅ Collect all build assets
- ✅ Generate cache manifest with hashes
- ✅ Create optimized Service Worker at `build/client/sw.js`
- ✅ Inject registration script into `index.html`

### Step 2: Serve Production Build

```bash
pnpm start
```

Or use any static file server:

```bash
npx serve build/client
```

### Step 3: Verify Installation

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. You should see the Service Worker registered
4. Check console for `[SW]` logs

## 📦 What's Included

### Automatic Features

- ✨ **Precaching**: Critical assets cached on install
- 🔄 **Smart Updates**: Detects and manages SW updates
- 💾 **Multiple Strategies**: Different caching per resource type
- 📱 **Offline Support**: Graceful degradation when offline
- 🧹 **Cache Cleanup**: Automatic old cache removal

### Caching Strategies

| Resource Type                   | Strategy               | Description                         |
| ------------------------------- | ---------------------- | ----------------------------------- |
| Static Assets (JS, CSS, images) | Cache First            | Fast, uses cache, updates on miss   |
| API Calls (/api/\*)             | Network First          | Always fresh, falls back to cache   |
| HTML Pages                      | Stale While Revalidate | Instant load, updates in background |

## 🛠️ Usage Examples

### Show Update Notification

Add the `ServiceWorkerManager` component to your app:

```tsx
// In app/root.tsx or any layout component
import { ServiceWorkerManager } from "./components/ServiceWorkerManager";

export default function App() {
  return (
    <>
      <Outlet />
      <ServiceWorkerManager />
    </>
  );
}
```

This provides:

- Visual update notifications
- Manual refresh button
- Debug info in development mode

### Use the Hook Directly

```tsx
import { useServiceWorker } from "./hooks/useServiceWorker";

function MyComponent() {
  const { status, hasUpdate, skipWaiting } = useServiceWorker();

  return (
    <div>
      <p>Status: {status.isActive ? "Online" : "Offline"}</p>

      {hasUpdate && (
        <button onClick={skipWaiting}>
          🔄 New Version Available - Click to Update
        </button>
      )}
    </div>
  );
}
```

### Manual Cache Control

```tsx
import { clearAllCaches, getCacheInfo } from "./utils/serviceWorker";

async function handleDebug() {
  // View cache usage
  const info = await getCacheInfo();
  console.log("Caches:", info);

  // Clear everything
  await clearAllCaches();
}
```

## 🔧 Configuration

### Customize Caching Behavior

Edit `app/sw.ts`:

```typescript
// Change cache names for versioning
const CACHE_NAME = "app-cache-v2"; // Increment when making changes

// Add custom URL patterns
if (url.pathname.startsWith("/graphql")) {
  event.respondWith(networkFirstStrategy(request));
}

// Modify offline fallback
return new Response(JSON.stringify({ error: "Custom offline message" }), {
  status: 503,
});
```

### Adjust Plugin Settings

Edit `vite.config.ts`:

```typescript
serviceWorkerPlugin({
  swSrc: "./app/sw.ts",
  swDest: "./build/client/sw.js",
  injectRegister: true, // Set false to manage manually
  precachePatterns: [
    "**/*.{js,css,html}", // Only precache these types
  ],
});
```

## 🐛 Debugging

### Enable Verbose Logging

Service Worker logs are prefixed with `[SW]`:

```javascript
[SW] Installing service worker...
[SW] Precaching app shell
[SW] Collected 42 assets for precaching
[SW] Registered with scope: /
[SW] Cache hit: /assets/index-abc123.js
[SW] Network success: /api/data
```

### Chrome DevTools Tips

1. **Application Tab**
   - View registered Service Workers
   - Inspect cache storage
   - Simulate offline mode

2. **Console Tab**
   - Filter by `[SW]` to see only SW logs
   - Monitor update events

3. **Network Tab**
   - See which requests are served from cache
   - Check "Size" column for "(from ServiceWorker)"

### Force Update Testing

```javascript
// In browser console
navigator.serviceWorker.getRegistration().then((reg) => {
  reg.update(); // Force check for updates
});
```

## ⚡ Performance Tips

### 1. Monitor Cache Hit Rate

```typescript
// Add to your analytics
const { caches } = await getCacheInfo();
console.log(
  "Total cached items:",
  caches.reduce((sum, c) => sum + (c.size || 0), 0),
);
```

### 2. Limit Cache Size

```typescript
// In sw.ts, add size checks
const MAX_CACHE_ITEMS = 100;
const keys = await cache.keys();
if (keys.length > MAX_CACHE_ITEMS) {
  await cache.delete(keys[0]); // Remove oldest
}
```

### 3. Prioritize Critical Resources

```typescript
// In vite.config.ts
precachePatterns: [
  "**/index.html",
  "**/index-*.js", // Main bundle
  "**/vendor-*.js", // Vendor bundles
  "**/*.css",
  // Exclude large images from precaching
];
```

## 🎯 Common Scenarios

### Scenario 1: Deploy New Version

1. Build and deploy normally
2. Users automatically get update notification
3. They click "Update Now" or refresh page
4. New Service Worker activates

**No manual intervention needed!**

### Scenario 2: Emergency Cache Clear

```typescript
// Broadcast to all clients
navigator.serviceWorker.ready.then((registration) => {
  registration.active?.postMessage({ type: "CLEAR_CACHE" });
});
```

### Scenario 3: Offline-First App

Modify `sw.ts` to cache API responses:

```typescript
// Cache API responses for offline use
if (url.pathname.startsWith("/api/")) {
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      })
      .catch(() => caches.match(request)),
  );
}
```

## ❓ FAQ

**Q: Why isn't my Service Worker updating?**  
A: Browsers wait for all tabs to close. Use "Skip waiting" in DevTools or call `skipWaiting()` programmatically.

**Q: Can I disable it in development?**  
A: Yes! It's automatically disabled in dev mode. The registration in `root.tsx` checks `import.meta.env.PROD`.

**Q: How much storage does it use?**  
A: Typically 10-50MB depending on cached assets. Check with `getCacheInfo()`.

**Q: Does it work with React Router?**  
A: Yes! The "Stale While Revalidate" strategy is perfect for SPA routing.

**Q: What happens on first visit?**  
A: Service Worker installs and precaches assets. Second visit is faster due to cache.

**Q: Can I use it with HTTPS only?**  
A: Service Workers require HTTPS in production. localhost works for development.

## 📚 Next Steps

1. Read full documentation: `SERVICE_WORKER.md`
2. Explore advanced features in the docs
3. Monitor performance impact in production
4. Customize strategies for your specific needs

## 🆘 Need Help?

Check these resources:

- Full documentation: `SERVICE_WORKER.md`
- Browser DevTools Application tab
- Console logs with `[SW]` prefix
- Vite build output for plugin errors

Happy caching! 🎉
