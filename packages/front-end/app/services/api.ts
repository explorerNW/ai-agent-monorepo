/**
 * API Service Module
 * Centralized API communication layer using environment configuration
 */

import { API_CONFIG, env } from "~/config/env";

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
  const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  return response.body;
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
