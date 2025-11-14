/**
 * AI Stream Hook
 * Manages streaming AI responses from the edge function
 */

import { useRef, useCallback } from 'react';
import { edgePost } from '@/utils/callEdge';
import type { EchoMessage } from '../state/echoTypes';

interface StreamOptions {
  onChunk: (content: string) => void;
  onComplete: (meta: { latency: number; meta?: any; modeUsed?: string }) => void;
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
        const data = await edgePost('clbhouz-pro-ai', {
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          conversation_id: conversationId,
          stream: true,
          mode: 'auto',
        });

        // Normalize the answer text
        const answer =
          typeof data === 'string'
            ? data
            : (data?.text as string) ??
              (data?.response as string) ??
              '';

        if (!answer) {
          throw new Error('Empty AI response');
        }

        // Single-chunk "stream"
        options.onChunk(answer);

        const latency = performance.now() - t0;
        options.onComplete({
          latency,
          meta: data?.meta,
          modeUsed: data?.modeUsed,
        });
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
