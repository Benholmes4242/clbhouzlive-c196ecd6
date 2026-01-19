import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';

// Debounce delay for post_media invalidations (ms)
const MEDIA_INVALIDATION_DEBOUNCE_MS = 300;

/**
 * Realtime subscription for personal profile posts.
 * Listens for posts and post_media changes to keep the feed fresh.
 * Secondary safety net - primary invalidation is via upload:complete event.
 */
export function useRealtimePersonalPosts(userId?: string) {
  const qc = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Channel for posts table changes
    const postsChannel = supabase
      .channel(`rt:personal-posts:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (row?.actor_type === 'personal' && row?.actor_id === userId) {
            qc.invalidateQueries({ queryKey: postKeys.actorPosts('personal', userId) });
            qc.invalidateQueries({ queryKey: postKeys.actorPostsCount('personal', userId) });
          }
        }
      )
      .subscribe();

    // Channel for post_media table changes - secondary safety net for media attachment
    const mediaChannel = supabase
      .channel(`rt:personal-post-media:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_media' },
        (_payload) => {
          // Debounce to avoid spamming invalidations for carousel posts
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          
          debounceTimerRef.current = setTimeout(() => {
            qc.invalidateQueries({ queryKey: postKeys.actorPosts('personal', userId) });
          }, MEDIA_INVALIDATION_DEBOUNCE_MS);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(mediaChannel);
    };
  }, [userId, qc]);
}
