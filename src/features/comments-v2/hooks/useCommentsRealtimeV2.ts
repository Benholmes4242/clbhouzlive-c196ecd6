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
          qc.invalidateQueries({ queryKey: ['comments-v2', targetType, targetId] });
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
          qc.invalidateQueries({ queryKey: ['comments-v2', targetType, targetId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId, enabled, qc]);
}
