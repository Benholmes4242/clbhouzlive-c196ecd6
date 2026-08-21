/**
 * useCommentsRealtimeV2 — subscribes to INSERT/DELETE on comments_v2 for a
 * given (targetType, targetId). Invalidates the useCommentsV2 cache so new
 * rows appear on the second device without a manual refetch. Likes are not
 * realtime-tracked (optimistic + RPC reconcile is enough).
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TargetType } from './useCommentsV2';

export function useCommentsRealtimeV2(
  targetType: TargetType,
  targetId: string,
  enabled: boolean,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !targetId) return;

    /**
     * KEY DRIFT, FIXED (BRIEF_REALTIME_COUNTS_AND_MENTION_TAP, report item 7).
     * This hook invalidated `['comments-v2', targetType, targetId]`, but every
     * READ in useCommentsV2 is keyed through `commentsKeys`, whose second
     * segment is the SCOPE STRING `"<targetType>:<targetId>:<secondary>"`. The
     * two never prefix-matched, so the sheet's realtime path has been
     * invalidating nothing at all. The scope, the filters and the `isOpen` gate
     * are untouched — only the key is corrected, through the factory.
     */
    const scopePrefix = `${targetType}:${targetId}:`;
    const invalidateThread = () =>
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === 'comments-v2' &&
          typeof q.queryKey[1] === 'string' &&
          (q.queryKey[1] as string).startsWith(scopePrefix),
      });

    const channelName = `comments-v2:${targetType}:${targetId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments_v2',
          filter: `target_id=eq.${targetId}`,
        },
        (payload) => {
          const row = (payload.new ?? {}) as { target_type?: string };
          if (row.target_type !== targetType) return;
          invalidateThread();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments_v2',
          filter: `target_id=eq.${targetId}`,
        },
        () => {
          invalidateThread();
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId, enabled, qc]);
}
