import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UcpSignalType = 'saved' | 'dismissed' | 'watched_partial' | 'watched_complete';

interface RecordSignalParams {
  postId: string;
  signalType: UcpSignalType;
  progressSeconds?: number;
  totalSeconds?: number;
}

/**
 * Hook for writing user_content_preferences rows.
 * Used by long-press actions, fullscreen progress tracking, and the
 * /settings/watch-preferences page.
 */
export function useUcpSignal(userId: string | undefined) {
  const queryClient = useQueryClient();

  const record = useCallback(
    async ({ postId, signalType, progressSeconds, totalSeconds }: RecordSignalParams) => {
      if (!userId) return;

      const { error } = await (supabase
        .from('user_content_preferences') as any)
        .upsert(
          {
            user_id: userId,
            post_id: postId,
            signal_type: signalType,
            progress_seconds: progressSeconds ?? null,
            total_seconds: totalSeconds ?? null,
            last_interaction_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,post_id,signal_type' },
        );

      if (error) {
        console.error('[useUcpSignal] upsert error:', error);
        return;
      }

      // Invalidate queries that depend on this signal.
      if (signalType === 'dismissed') {
        queryClient.invalidateQueries({ queryKey: ['watch-feed'] });
      }
      if (signalType === 'watched_partial' || signalType === 'watched_complete') {
        queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
      }
      if (signalType === 'saved') {
        queryClient.invalidateQueries({ queryKey: ['watch-preferences', userId] });
      }
    },
    [userId, queryClient],
  );

  const remove = useCallback(
    async ({ postId, signalType }: { postId: string; signalType: UcpSignalType }) => {
      if (!userId) return;
      const { error } = await (supabase
        .from('user_content_preferences') as any)
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('signal_type', signalType);

      if (error) {
        console.error('[useUcpSignal] delete error:', error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['watch-feed'] });
      queryClient.invalidateQueries({ queryKey: ['watch-preferences', userId] });
    },
    [userId, queryClient],
  );

  return { record, remove };
}
