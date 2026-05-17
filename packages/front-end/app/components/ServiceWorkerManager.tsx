import { useServiceWorker } from "../hooks/useServiceWorker";

export function ServiceWorkerManager() {
  const {
    status,
    isLoading,
    error,
    checkForUpdates,
    skipWaiting,
    refreshCache,
    hasUpdate,
  } = useServiceWorker();

  if (!status.isSupported) {
    return null; // Don't show anything if SW is not supported
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
        Initializing Service Worker...
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
        SW Error: {error.message}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {/* Update notification */}
      {hasUpdate && (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
          <p className="font-semibold mb-2">New version available!</p>
          <button
            onClick={skipWaiting}
            className="bg-white text-yellow-600 px-3 py-1 rounded font-medium hover:bg-yellow-50 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}

      {/* Status indicator */}
      <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              status.isActive ? "bg-green-500" : "bg-gray-500"
            }`}
          />
          <span>{status.isActive ? "Online" : "Offline"}</span>
        </div>

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-2 text-xs text-gray-400">
            <div>Registered: {status.isRegistered ? "✓" : "✗"}</div>
            <div>Active: {status.isActive ? "✓" : "✗"}</div>
          </div>
        )}
      </div>

      {/* Manual controls (dev only) */}
      {import.meta.env.DEV && (
        <div className="flex gap-2">
          <button
            onClick={checkForUpdates}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Check Updates
          </button>
          <button
            onClick={refreshCache}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition-colors"
          >
            Refresh Cache
          </button>
        </div>
      )}
    </div>
  );
}
