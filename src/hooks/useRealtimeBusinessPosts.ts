import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';

// Debounce delay for post_media invalidations (ms)
const MEDIA_INVALIDATION_DEBOUNCE_MS = 300;

export function useRealtimeBusinessPosts(businessId?: string) {
  const qc = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!businessId) return;

    // Channel for posts table changes
    const postsChannel = supabase
      .channel(`rt:business-posts:${businessId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (row?.actor_type === 'business' && row?.actor_id === businessId) {
            qc.invalidateQueries({ queryKey: postKeys.actorPosts('business', businessId) });
            qc.invalidateQueries({ queryKey: postKeys.actorPostsCount('business', businessId) });
          }
        }
      )
      .subscribe();

    // Channel for post_media table changes - secondary safety net for media attachment
    // When media is inserted, check if it belongs to a post from this business
    const mediaChannel = supabase
      .channel(`rt:business-post-media:${businessId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_media' },
        async (payload) => {
          // Get the post_id from the inserted media
          const postId = (payload.new as any)?.post_id;
          if (!postId) return;
          
          // Check if this post belongs to this business (quick lookup)
          const { data: post } = await supabase
            .from('posts')
            .select('actor_id, actor_type')
            .eq('id', postId)
            .single();
          
          if (post?.actor_type === 'business' && post?.actor_id === businessId) {
            // Debounce to avoid spamming invalidations for carousel posts
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            
            debounceTimerRef.current = setTimeout(() => {
              console.log('[useRealtimeBusinessPosts] post_media INSERT detected for this business, invalidating feed');
              qc.invalidateQueries({ queryKey: postKeys.actorPosts('business', businessId) });
            }, MEDIA_INVALIDATION_DEBOUNCE_MS);
          }
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
  }, [businessId, qc]);
}
