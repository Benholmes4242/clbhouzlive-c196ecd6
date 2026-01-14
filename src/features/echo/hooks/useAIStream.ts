/**
 * AI Stream Hook
 * Manages true SSE streaming AI responses from the edge function
 */

import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const EDGE_BASE = "https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1";

interface StreamOptions {
  onChunk: (content: string) => void;
  onComplete: (meta: { latency: number; meta?: any; modeUsed?: string }) => void;
  onError: (error: string, errorType?: string) => void;
}

interface SSEData {
  token?: string;
  done?: boolean;
  error?: string;
  meta?: any;
}

export type RateLimitError = 'RATE_LIMIT_MINUTE' | 'RATE_LIMIT_HOUR' | 'RATE_LIMIT_DAY' | 'PROVIDER_RATE_LIMIT';

export function useAIStream() {
  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      conversationId: string,
      options: StreamOptions
    ) => {
      // Abort any previous request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = new AbortController();
      controllerRef.current = controller;

      const t0 = performance.now();

      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`${EDGE_BASE}/clbhouz-pro-ai`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            conversation_id: conversationId,
            stream: true,
            mode: 'auto',
          }),
          signal: controller.signal,
        });

        // Handle rate limit errors
        if (response.status === 429) {
          const errorData = await response.json();
          const errorType = errorData.error as RateLimitError;
          options.onError(errorData.text || 'Rate limit exceeded', errorType);
          return;
        }

        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.text || errorData.error || `Request failed with status ${response.status}`);
        }

        // Check if we got SSE or JSON response
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('text/event-stream')) {
          // True SSE streaming
          await parseSSEStream(response, options, t0);
        } else {
          // Fallback: JSON response (non-streaming)
          const data = await response.json();
          const answer = data?.text ?? data?.response ?? '';
          
          if (!answer) {
            throw new Error('Empty AI response');
          }

          options.onChunk(answer);
          options.onComplete({
            latency: performance.now() - t0,
            meta: data?.meta,
            modeUsed: data?.modeUsed,
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[AIStream] Request aborted');
          return;
        }

        console.error('[AIStream] Error:', error);
        options.onError(error.message || 'Failed to get AI response');
      }
    },
    []
  );

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  return {
    sendMessage,
    abort,
  };
}

/**
 * Parse SSE stream and call callbacks for each token
 */
async function parseSSEStream(
  response: Response,
  options: StreamOptions,
  startTime: number
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let meta: any = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process line-by-line
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        // Handle CRLF
        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }

        // Skip comments and empty lines
        if (line.startsWith(':') || line.trim() === '') {
          continue;
        }

        // Skip non-data lines
        if (!line.startsWith('data: ')) {
          continue;
        }

        const jsonStr = line.slice(6).trim();
        
        // Handle stream end
        if (jsonStr === '[DONE]') {
          break;
        }

        try {
          const parsed: SSEData = JSON.parse(jsonStr);

          // Handle error events
          if (parsed.error) {
            // If there's also a token, show it (fallback message)
            if (parsed.token) {
              options.onChunk(parsed.token);
            }
            continue;
          }

          // Handle completion event
          if (parsed.done && parsed.meta) {
            meta = parsed.meta;
            continue;
          }

          // Handle token
          if (parsed.token) {
            options.onChunk(parsed.token);
          }
        } catch {
          // Re-buffer partial JSON and wait for more data
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Flush any remaining buffer
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const parsed: SSEData = JSON.parse(jsonStr);
          if (parsed.token) {
            options.onChunk(parsed.token);
          }
          if (parsed.done && parsed.meta) {
            meta = parsed.meta;
          }
        } catch {
          // Ignore partial leftovers
        }
      }
    }

    // Complete
    options.onComplete({
      latency: performance.now() - startTime,
      meta,
      modeUsed: meta?.provider === 'perplexity' ? 'live' : 'static',
    });
  } finally {
    reader.releaseLock();
  }
}
