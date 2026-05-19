/**
 * Environment Configuration Module
 * Centralized management of all environment variables with type safety
 */

interface EnvConfig {
  // API Configuration
  apiBaseUrl: string;

  // Application Info
  appName: string;
  appVersion: string;

  // Feature Flags
  enableStreaming: boolean;
  enableFileUpload: boolean;

  // Development
  debugMode: boolean;
}

/**
 * Parse environment variables from import.meta.env
 * All Vite environment variables must be prefixed with VITE_
 */
export const env: EnvConfig = {
  // API Configuration
  // Use relative path to avoid mixed content issues
  // All API requests will go through Nginx HTTPS proxy
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",

  // Application Info
  appName: import.meta.env.VITE_APP_NAME || "AI Assistant",
  appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",

  // Feature Flags
  enableStreaming: import.meta.env.VITE_ENABLE_STREAMING !== "false",
  enableFileUpload: import.meta.env.VITE_ENABLE_FILE_UPLOAD === "true",

  // Development
  debugMode: import.meta.env.VITE_DEBUG_MODE === "true",
};

/**
 * API Configuration Constants
 * Pre-configured endpoints for common API calls
 */
export const API_CONFIG = {
  BASE_URL: env.apiBaseUrl,
  CHAT_ENDPOINT: `${env.apiBaseUrl}/ai/chat`,
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * Utility function to get full API URL for a given endpoint
 * @param endpoint - API endpoint path (e.g., '/chat', '/users')
 * @returns Full URL string
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = env.apiBaseUrl.replace(/\/$/, ""); // Remove trailing slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * Log current configuration in debug mode
 */
if (env.debugMode) {
  console.log("🔧 App Configuration:", {
    apiBaseUrl: env.apiBaseUrl,
    appName: env.appName,
    version: env.appVersion,
    features: {
      streaming: env.enableStreaming,
      fileUpload: env.enableFileUpload,
    },
  });
}
