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
  onError: (error: string, errorType?: string, retryAfter?: number) => void;
}

interface SSEData {
  token?: string;
  done?: boolean;
  meta?: {
    provider?: string;
    routeReason?: string;
    latencyMs?: number;
  };
  error?: string;
  text?: string;
  retryAfter?: number;
}

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
        // Get auth session for headers
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch(`${EDGE_BASE}/clbhouz-pro-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
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
          const data = await response.json();
          options.onError(
            data.text || 'Rate limit exceeded', 
            data.error, 
            data.retryAfter
          );
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Request failed with status ${response.status}`);
        }

        // Check if response is SSE stream
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/event-stream')) {
          // True SSE streaming response
          await parseSSEStream(response, options, t0, controller.signal);
        } else {
          // Fallback: non-streaming JSON response
          const data = await response.json();
          const answer =
            typeof data === 'string'
              ? data
              : (data?.text as string) ?? (data?.response as string) ?? '';

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
 * Parse SSE stream and emit tokens as they arrive
 */
async function parseSSEStream(
  response: Response,
  options: StreamOptions,
  startTime: number,
  signal: AbortSignal
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let meta: any = null;

  try {
    while (true) {
      if (signal.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        // Handle CRLF
        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }

        // Skip comments and empty lines
        if (line.startsWith(':') || line.trim() === '') continue;
        
        // Skip non-data lines
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        
        // Check for stream end
        if (jsonStr === '[DONE]') {
          const latency = performance.now() - startTime;
          options.onComplete({
            latency,
            meta,
            modeUsed: meta?.provider === 'perplexity' ? 'live' : 'static',
          });
          return;
        }

        try {
          const data: SSEData = JSON.parse(jsonStr);

          // Handle errors in stream
          if (data.error) {
            options.onError(data.text || 'Stream error', data.error, data.retryAfter);
            return;
          }

          // Emit token
          if (data.token) {
            options.onChunk(data.token);
          }

          // Store meta for completion
          if (data.done && data.meta) {
            meta = data.meta;
          }
        } catch (parseError) {
          // Incomplete JSON - put back and wait for more data
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Final flush for any remaining buffered content
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const data: SSEData = JSON.parse(jsonStr);
          if (data.token) {
            options.onChunk(data.token);
          }
          if (data.done && data.meta) {
            meta = data.meta;
          }
        } catch {
          // Ignore partial leftovers
        }
      }
    }

    // If we didn't get a [DONE] signal, still complete
    const latency = performance.now() - startTime;
    options.onComplete({
      latency,
      meta,
      modeUsed: meta?.provider === 'perplexity' ? 'live' : 'static',
    });
  } finally {
    reader.releaseLock();
  }
}
