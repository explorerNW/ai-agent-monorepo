/**
 * API Service Module
 * Centralized API communication layer using environment configuration
 */

import { API_CONFIG } from '~/config/env';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
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
export async function sendChatMessage(messages: ChatMessage[]): Promise<ReadableStream> {
  const startTime = performance.now();
  const analytics_uid = localStorage.getItem('analytics_uid') || startTime.toString();

  try {
    const response = await fetch(API_CONFIG.CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': analytics_uid,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  } catch (error) {
    console.error('Chat API call failed:', error);
    throw error;
  }
}

/**
 * Query Web Vitals statistics from backend
 * @param days - Number of days to query (default: 7)
 * @param url - Optional URL filter
 * @returns Web Vitals statistics data
 */
export async function getWebVitalsStats(days: number = 7, url?: string) {
  const now = new Date();
  const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const params = new URLSearchParams();
  params.append('fromDate', formatDate(fromDate));
  params.append('toDate', formatDate(now));

  if (url) {
    params.append('url', url);
  }

  try {
    return fetch(`${API_CONFIG.BASE_URL}/api/performance/summary?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to fetch Web Vitals stats:', error);
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
  const decoder = new TextDecoder('utf-8');

  try {
    let done = false;
    while (!done) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

/**
 * Fetch API performance statistics
 * @param days - Number of days to query (default: 7)
 * @returns API performance statistics data
 */
export async function getApiPerformance(days: number = 7) {
  const now = new Date();
  const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const params = new URLSearchParams();
  params.append('fromDate', formatDate(fromDate));
  params.append('toDate', formatDate(now));
  try {
    return fetch(`${API_CONFIG.BASE_URL}/api/performance/api-summary?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to fetch Web Vitals stats:', error);
    throw error;
  }
}
