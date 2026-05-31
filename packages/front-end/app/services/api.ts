/**
 * API Service Module
 * Centralized API communication layer using environment configuration
 */

import { API_CONFIG, env } from "~/config/env";
import { analyticsInstance } from "~/core/instance";
import type { WebVitalsData } from "~/types/performance";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  content: string;
  done?: boolean;
}

/**
 * Send chat message to AI backend with streaming support
 * @param messages - Array of chat messages
 * @returns ReadableStream for processing response
 */
export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<ReadableStream> {
  const startTime = performance.now();
  const analytics_uid =
    localStorage.getItem("analytics_uid") || startTime.toString();

  try {
    const response = await analyticsInstance.trackedFetch(
      API_CONFIG.CHAT_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": analytics_uid,
        },
        body: JSON.stringify({ messages }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    return response.body;
  } catch (error) {
    console.error("Chat API call failed:", error);
    throw error;
  }
}

/**
 * Query Web Vitals statistics from backend
 * @param days - Number of days to query (default: 7)
 * @param url - Optional URL filter
 * @returns Web Vitals statistics data
 */
export async function getWebVitalsStats(
  days: number = 7,
  url?: string,
): Promise<WebVitalsData[]> {
  const params = new URLSearchParams();
  params.append("days", days.toString());
  if (url) {
    params.append("url", url);
  }

  try {
    const response = await analyticsInstance.trackedFetch(
      `${API_CONFIG.BASE_URL}/api/v1/track/web-vitals/stats?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch Web Vitals stats:", error);
    throw error;
  }
}

/**
 * Utility: Process streaming response chunk by chunk
 * @param stream - ReadableStream from API response
 * @param onChunk - Callback for each chunk
 * @param onComplete - Callback when stream completes
 */
export async function processStream(
  stream: ReadableStream,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");

  try {
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    }

    if (onComplete) {
      onComplete();
    }
  } finally {
    reader.releaseLock();
  }
}
