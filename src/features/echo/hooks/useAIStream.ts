/**
 * AI Stream Hook
 * Manages streaming AI responses from the edge function
 */

import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EchoMessage } from '../state/echoTypes';

interface StreamOptions {
  onChunk: (content: string) => void;
  onComplete: (meta: { latency: number }) => void;
  onError: (error: string) => void;
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

      try {
        const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
          body: {
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            conversation_id: conversationId,
            stream: true,
            mode: 'chat',
          },
        });

        if (error) throw error;

        // Handle streaming response
        if (data && typeof data === 'object' && 'text' in data) {
          // Non-streaming response (fallback)
          options.onChunk(data.text as string);
          const latency = performance.now() - t0;
          options.onComplete({ latency });
        } else if (data && typeof data === 'string') {
          // Streamed response came through as string
          options.onChunk(data);
          const latency = performance.now() - t0;
          options.onComplete({ latency });
        } else {
          throw new Error('Unexpected response format');
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
