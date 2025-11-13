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
        // Extract the last message as the current user message
        const last = messages[messages.length - 1];
        
        if (!last || last.role !== 'user') {
          throw new Error('Missing user message');
        }

        // Everything before the last message is the conversation history
        const conversation = messages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Get timezone
        const timezone =
          typeof Intl !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : 'UTC';

        const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
          body: {
            message: last.content,
            conversation,
            mode: 'chat',
            isEcho: true,
            timezone,
          },
        });

        if (error) {
          throw new Error(error.message || 'Echo request failed');
        }

        // Expecting `{ text: string }` from the function
        if (!data || typeof data.text !== 'string') {
          throw new Error('Unexpected Echo response');
        }

        // Send the complete response
        options.onChunk(data.text);
        const latency = performance.now() - t0;
        options.onComplete({ latency });
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
