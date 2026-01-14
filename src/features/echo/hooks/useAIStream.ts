/**
 * AI Stream Hook
 * Manages true SSE streaming AI responses with token-by-token rendering
 */

import { useRef, useCallback } from 'react';
import type { EchoMessage } from '../state/echoTypes';

interface StreamOptions {
  onChunk: (content: string) => void;
  onComplete: (meta: { latency: number; meta?: any; modeUsed?: string }) => void;
  onError: (error: string, errorType?: string) => void;
}

// Rate limit error types
export type RateLimitErrorType = 
  | 'RATE_LIMIT_MINUTE'
  | 'RATE_LIMIT_HOUR'
  | 'RATE_LIMIT_DAY'
  | 'PROVIDER_RATE_LIMIT'
  | 'PAYMENT_REQUIRED'
  | 'GENERIC_ERROR';

export function parseRateLimitError(status: number, body?: any): { message: string; type: RateLimitErrorType } {
  if (status === 402) {
    return {
      message: "You've run out of AI credits. Please add more credits to continue.",
      type: 'PAYMENT_REQUIRED'
    };
  }
  
  if (status === 429) {
    const errorMessage = body?.error || '';
    
    if (errorMessage.includes('minute')) {
      return {
        message: "You're sending messages too quickly. Please wait a moment.",
        type: 'RATE_LIMIT_MINUTE'
      };
    }
    if (errorMessage.includes('hour')) {
      return {
        message: "You've reached your hourly limit. Try again in a few minutes.",
        type: 'RATE_LIMIT_HOUR'
      };
    }
    if (errorMessage.includes('day')) {
      return {
        message: "You've reached your daily limit. Resets at midnight.",
        type: 'RATE_LIMIT_DAY'
      };
    }
    
    return {
      message: "Our AI service is busy. Please try again in a few seconds.",
      type: 'PROVIDER_RATE_LIMIT'
    };
  }
  
  return {
    message: body?.error || 'Failed to get AI response',
    type: 'GENERIC_ERROR'
  };
}

export function useAIStream() {
  const controllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      messages: Pick<EchoMessage, 'role' | 'content'>[],
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
      let fullContent = '';
      let modeUsed = '';
      let metaData: any = null;

      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/clbhouz-pro-ai`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            conversation_id: conversationId,
            stream: true,
            mode: 'auto',
          }),
          signal: controller.signal,
        });

        // Handle error status codes
        if (!response.ok) {
          let errorBody: any = null;
          try {
            errorBody = await response.json();
          } catch {
            // Ignore JSON parse errors
          }
          
          const { message, type } = parseRateLimitError(response.status, errorBody);
          options.onError(message, type);
          return;
        }

        const contentType = response.headers.get('content-type') || '';
        
        // Check if this is an SSE stream
        if (contentType.includes('text/event-stream')) {
          // True SSE streaming - parse token by token
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              let line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);

              // Handle CRLF
              if (line.endsWith('\r')) {
                line = line.slice(0, -1);
              }

              // Skip empty lines and comments
              if (line.trim() === '' || line.startsWith(':')) {
                continue;
              }

              // Parse SSE data line
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                
                // Check for stream end
                if (jsonStr === '[DONE]') {
                  break;
                }

                try {
                  const parsed = JSON.parse(jsonStr);
                  
                  // Extract token from OpenAI-style delta
                  const token = parsed.choices?.[0]?.delta?.content;
                  if (token) {
                    fullContent += token;
                    options.onChunk(token);
                  }
                  
                  // Check for metadata in final chunk
                  if (parsed.modeUsed) modeUsed = parsed.modeUsed;
                  if (parsed.meta) metaData = parsed.meta;
                } catch {
                  // Incomplete JSON, put it back and wait for more
                  buffer = line + '\n' + buffer;
                  break;
                }
              }
            }
          }

          // Process any remaining buffer
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (let raw of lines) {
              if (!raw.trim() || raw.startsWith(':')) continue;
              if (raw.endsWith('\r')) raw = raw.slice(0, -1);
              if (!raw.startsWith('data: ')) continue;
              
              const jsonStr = raw.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  fullContent += token;
                  options.onChunk(token);
                }
                if (parsed.modeUsed) modeUsed = parsed.modeUsed;
                if (parsed.meta) metaData = parsed.meta;
              } catch {
                // Ignore incomplete final chunks
              }
            }
          }
        } else {
          // Fallback: Non-streaming JSON response
          const data = await response.json();
          
          const answer =
            typeof data === 'string'
              ? data
              : (data?.text as string) ??
                (data?.response as string) ??
                '';

          if (!answer) {
            throw new Error('Empty AI response');
          }

          fullContent = answer;
          modeUsed = data?.modeUsed || '';
          metaData = data?.meta;
          
          // Emit full content as single chunk
          options.onChunk(answer);
        }

        const latency = performance.now() - t0;
        options.onComplete({
          latency,
          meta: metaData,
          modeUsed,
        });
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[AIStream] Request aborted');
          return;
        }

        console.error('[AIStream] Error:', error);
        options.onError(error.message || 'Failed to get AI response', 'GENERIC_ERROR');
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
