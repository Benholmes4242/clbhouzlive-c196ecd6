/**
 * Hook to auto-send a message from URL query parameter
 * Used for deep-linking to chat with pre-filled message
 */

import { useEffect, useRef } from 'react';

type SendFn = (text: string) => void;

interface AutoSendOptions {
  param?: string;
  maxLen?: number;
  stripOn?: 'success' | 'always';
}

export function useAutoSendFromQuery(onSend: SendFn, opts?: AutoSendOptions) {
  const { param = 'msg', maxLen = 800, stripOn = 'always' } = opts || {};
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const url = new URL(window.location.href);
    const raw = url.searchParams.get(param);
    if (!raw) return;

    // decode + basic sanitization
    const decoded = raw.replace(/\+/g, ' ');
    const text = decoded.trim().slice(0, maxLen); // hard cap

    if (!text) {
      // strip empty param
      url.searchParams.delete(param);
      window.history.replaceState({}, '', url.toString());
      return;
    }

    firedRef.current = true;
    try {
      onSend(text);
    } catch (e) {
      console.warn('[useAutoSendFromQuery] Send failed:', e);
    } finally {
      if (stripOn === 'always') {
        url.searchParams.delete(param);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [onSend, param, maxLen, stripOn]);
}
