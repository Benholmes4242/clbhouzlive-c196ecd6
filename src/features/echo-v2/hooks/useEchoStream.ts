import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EchoMessageMeta } from './useEchoChatMessages';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/echo-intelligence-v2`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface StreamCallbacks {
  onChatId?: (chatId: string) => void;
  onDelta?: (delta: string, accumulated: string) => void;
  onMeta?: (meta: EchoMessageMeta & { text?: string }) => void;
  onDone?: (finalText: string, meta: EchoMessageMeta | null, chatId: string | null) => void;
  onError?: (kind: 'rate_limit' | 'generic', message: string, retryAfterSec?: number) => void;
}

export interface StreamState {
  streaming: boolean;
  text: string;
  meta: EchoMessageMeta | null;
  chatId: string | null;
  error: { kind: 'rate_limit' | 'generic'; message: string; retryAfterSec?: number } | null;
}

const INITIAL: StreamState = { streaming: false, text: '', meta: null, chatId: null, error: null };

export function useEchoStream() {
  const [state, setState] = useState<StreamState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);
  const cbsRef = useRef<StreamCallbacks>({});

  const reset = useCallback(() => setState(INITIAL), []);

  const send = useCallback(
    async (chatId: string | null, message: string, cbs?: StreamCallbacks) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      cbsRef.current = cbs ?? {};

      setState({ streaming: true, text: '', meta: null, chatId, error: null });

      let accumulated = '';
      let finalMeta: EchoMessageMeta | null = null;
      let resolvedChatId: string | null = chatId;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          const err = { kind: 'generic' as const, message: 'Not signed in.' };
          setState({ ...INITIAL, error: err });
          cbsRef.current.onError?.(err.kind, err.message);
          return;
        }

        const res = await fetch(EDGE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': ANON_KEY,
          },
          body: JSON.stringify({ chat_id: chatId, message }),
          signal: controller.signal,
        });

        if (res.status === 429) {
          let payload: { error?: string; retryAfter?: number } = {};
          try { payload = await res.json(); } catch { /* ignore */ }
          const secs = Math.max(1, Number(payload.retryAfter ?? 30));
          const err = {
            kind: 'rate_limit' as const,
            message: `Echo needs a breather — try again in ${secs}s`,
            retryAfterSec: secs,
          };
          setState({ ...INITIAL, error: err });
          cbsRef.current.onError?.('rate_limit', err.message, secs);
          return;
        }

        if (!res.ok || !res.body) {
          const err = { kind: 'generic' as const, message: 'Echo hit a snag — try again.' };
          setState({ ...INITIAL, error: err });
          cbsRef.current.onError?.('generic', err.message);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent: string | null = null;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const nl = buffer.indexOf('\n\n');
            if (nl === -1) break;
            const raw = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 2);

            currentEvent = null;
            let dataStr = '';
            for (const line of raw.split('\n')) {
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr += line.slice(5).trim();
              }
            }

            if (!dataStr) continue;
            if (dataStr === '[DONE]') continue;

            let payload: Record<string, unknown> = {};
            try { payload = JSON.parse(dataStr); } catch { continue; }

            if (currentEvent === 'chat') {
              const cid = (payload.chat_id as string | undefined) ?? null;
              if (cid) {
                resolvedChatId = cid;
                setState((s) => ({ ...s, chatId: cid }));
                cbsRef.current.onChatId?.(cid);
              }
            } else if (currentEvent === 'meta') {
              const meta = payload as EchoMessageMeta & { text?: string };
              finalMeta = { ...meta };
              if (typeof meta.text === 'string' && meta.text.length > 0) {
                accumulated = meta.text;
              }
              setState((s) => ({ ...s, text: accumulated, meta: finalMeta }));
              cbsRef.current.onMeta?.(meta);
            } else if (currentEvent === 'error') {
              const msg = (payload.error as string) || 'Echo hit a snag — try again.';
              const err = { kind: 'generic' as const, message: msg };
              setState({ ...INITIAL, error: err });
              cbsRef.current.onError?.('generic', msg);
              return;
            } else {
              const delta = payload.delta as string | undefined;
              if (typeof delta === 'string' && delta.length > 0) {
                accumulated += delta;
                setState((s) => ({ ...s, text: accumulated }));
                cbsRef.current.onDelta?.(delta, accumulated);
              }
            }
          }
        }

        setState({ streaming: false, text: '', meta: null, chatId: null, error: null });
        cbsRef.current.onDone?.(accumulated, finalMeta, resolvedChatId);
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        const err = { kind: 'generic' as const, message: 'Echo hit a snag — try again.' };
        setState({ ...INITIAL, error: err });
        cbsRef.current.onError?.('generic', err.message);
      }
    },
    []
  );

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(INITIAL);
  }, []);

  return { state, send, abort, reset };
}
