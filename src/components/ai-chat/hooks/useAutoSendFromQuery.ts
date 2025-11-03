/**
 * Hook to auto-send a message from URL query parameter
 * Used for deep-linking to chat with pre-filled message
 */

import { useEffect } from 'react';

export function useAutoSendFromQuery(onSend: (msg: string) => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (!msg) return;
    const text = msg.trim();
    if (!text) return;

    // Fire once
    onSend(text);

    // Strip the query param without a full reload
    params.delete('msg');
    const url = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', url);
  }, [onSend]);
}
