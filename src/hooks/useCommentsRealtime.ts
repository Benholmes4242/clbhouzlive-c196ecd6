import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCommentsRealtime(postId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!postId) return;
    
    // Subscribe to comment changes
    const commentsChannel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log('[Realtime] Comment change:', payload.eventType);
          // Invalidate and refetch comments
          queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_likes',
        },
        (payload) => {
          console.log('[Realtime] Like change:', payload.eventType);
          // Invalidate comments to refresh like counts
          queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
        },
        (payload) => {
          console.log('[Realtime] Reaction change:', payload.eventType);
          // Invalidate reactions
          queryClient.invalidateQueries({ queryKey: ['comment-reactions', postId] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });
    
    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [postId, queryClient]);
}
