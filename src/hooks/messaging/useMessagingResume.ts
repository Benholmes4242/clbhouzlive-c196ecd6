import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessagingActor } from './useMessagingActor';
import { getRegisteredMessagingChannels } from './messagingResumeRegistry';

/**
 * Mount ONCE in the messaging shell. On foreground/visibility resume:
 *  - checks channel health of registered messaging channels and resubscribes
 *    any whose state is not 'joined' (via the hook-provided resubscribe cb)
 *  - invalidates active messaging queries + all actor-unread-counts queries
 *
 * Event-driven only — no polling.
 */
export function useMessagingResume() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const actor = useMessagingActor();

  useEffect(() => {
    if (!user || !actor) return;

    let debounce: ReturnType<typeof setTimeout> | null = null;

    const handleResume = () => {
      // Channel health: resubscribe any registered channel not in 'joined'.
      for (const entry of getRegisteredMessagingChannels()) {
        try {
          const ch = entry.getChannel();
          const state = (ch as unknown as { state?: string } | null)?.state;
          if (!ch || state !== 'joined') {
            entry.resubscribe();
          }
        } catch {
          // If probing fails, force a resubscribe defensively.
          try { entry.resubscribe(); } catch { /* noop */ }
        }
      }

      // Cache refresh regardless of channel state.
      queryClient.invalidateQueries({ queryKey: ['messaging'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['actor-unread-counts'], refetchType: 'all' });
    };

    const scheduleResume = () => {
      if (debounce) clearTimeout(debounce);
      // Debounce so visibilitychange + focus (which often fire together on
      // WebView foreground) collapse into a single handler invocation.
      debounce = setTimeout(handleResume, 50);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleResume();
    };
    const onFocus = () => scheduleResume();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      if (debounce) clearTimeout(debounce);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [queryClient, user, actor]);
}
