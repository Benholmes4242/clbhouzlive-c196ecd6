import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';
import { postKeys } from '@/queryKeys/posts';

export const usePostDeletion = () => {
  const queryClient = useQueryClient();

  /**
   * Delete a post and invalidate all relevant caches
   * @param postId - The ID of the post to delete
   * @param actorType - Optional actor type ('personal' | 'business') for targeted cache invalidation
   * @param actorId - Optional actor ID for targeted cache invalidation
   */
  const deletePost = async (
    postId: string,
    actorType?: 'personal' | 'business',
    actorId?: string,
    userId?: string
  ) => {
    try {
      // 0. Look up the post to enforce review-derived routing rule.
      //    Posts with source_review_id are owned by the underlying review —
      //    deletion must go through the review wizard so both stay coherent.
      const { data: postRow, error: postLookupError } = await supabase
        .from('posts')
        .select('id, source_review_id')
        .eq('id', postId)
        .maybeSingle();

      if (postLookupError) {
        console.error('Error loading post for delete:', postLookupError);
        throw new Error(`Failed to load post: ${postLookupError.message}`);
      }
      if (!postRow) {
        // Already gone — treat as success (idempotent).
        return { success: true };
      }
      if (postRow.source_review_id) {
        toast.error('Manage this from your review', {
          description: 'This post is part of a course review. Open the review to edit or delete it.',
          duration: 5000,
        });
        return { success: false, error: new Error('Review-derived post — route to review') };
      }

      // 1. Snapshot media rows BEFORE the cascade fires so we can clean up
      //    Cloudflare Stream + R2 assets afterwards. URLs/stream_ids are
      //    unrecoverable once the rows are gone.
      const { data: mediaRows, error: mediaFetchError } = await supabase
        .from('post_media')
        .select('id, media_url, media_type, stream_id')
        .eq('post_id', postId);

      if (mediaFetchError) {
        console.warn('Could not snapshot post media for cleanup:', mediaFetchError);
      }

      // 2. Delete the post. FK cascades handle post_media, post_tags,
      //    post_courses, post_likes, post_comments, post_shares, etc.
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (postError) {
        console.error('Error deleting post:', postError);
        throw new Error(`Failed to delete post: ${postError.message}`);
      }

      // 3. Fire-and-forget external storage cleanup (Cloudflare Stream + R2).
      //    Reuses cleanup-review-media — it's media-type-agnostic.
      if (mediaRows && mediaRows.length > 0) {
        const mediaItems = mediaRows.map((m: any) => ({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type as 'image' | 'video',
          stream_id: m.stream_id,
        }));
        supabase.functions.invoke('cleanup-review-media', {
          body: { mediaItems },
        }).catch((err) => {
          console.warn('[usePostDeletion] Failed to cleanup media:', err);
        });
      }

      // Show delete toast
      showToast("Post deleted");


      // Helper: strip deleted post from any infinite-query or array cache
      const stripPost = (old: any) => {
        if (!old) return old;
        // Infinite query shape ({ pages })
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: (page.posts ?? page.data ?? []).filter((p: any) => p.id !== postId),
              ...(page.data ? { data: (page.data ?? []).filter((p: any) => p.id !== postId) } : {}),
            })),
          };
        }
        // Plain array
        if (Array.isArray(old)) return old.filter((p: any) => p.id !== postId);
        return old;
      };

      // Optimistically remove from all known caches instantly
      const allQueries = queryClient.getQueryCache().getAll();
      for (const q of allQueries) {
        const key = q.queryKey as string[];
        const k0 = key[0];
        if (
          k0 === 'media-feed' ||
          k0 === 'profile-posts' ||
          k0 === 'actor-posts' ||
          k0 === 'trending-posts' ||
          k0 === 'infinite-followed-posts' ||
          k0 === 'activity-posts' ||
          k0 === 'userPosts' ||
          k0 === 'followedUsersPosts' ||
          k0 === 'explore-content' ||
          k0 === 'pinned-posts' ||
          k0 === 'featured-post'
        ) {
          queryClient.setQueryData(key, stripPost);
        }
      }

      // Decrement count instantly
      if (actorType && actorId) {
        const countKey = postKeys.actorPostsCount(actorType, actorId);
        queryClient.setQueryData(countKey, (old: number | undefined) =>
          Math.max((old ?? 1) - 1, 0)
        );
      }

      // Then invalidate everything to refetch clean data
      if (actorType && actorId) {
        queryClient.invalidateQueries({ queryKey: postKeys.actorPosts(actorType, actorId) });
        queryClient.invalidateQueries({ queryKey: postKeys.profilePosts(actorType, actorId) });
        queryClient.invalidateQueries({ queryKey: postKeys.actorPostsCount(actorType, actorId) });
      }
      queryClient.invalidateQueries({ queryKey: ['media-feed'] });
      queryClient.invalidateQueries({ queryKey: postKeys.trending() });
      queryClient.invalidateQueries({ queryKey: ['infinite-followed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['activity-posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['followedUsersPosts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-content'] });
      queryClient.invalidateQueries({ queryKey: ['pinned-posts'] });
      queryClient.invalidateQueries({ queryKey: ['featured-post'] });
      queryClient.invalidateQueries({ queryKey: ['creator-features'] });

      // Broadcast delete event for additional UI cleanup (window events)
      window.dispatchEvent(new CustomEvent('postDeleted', { 
        detail: { postId, actorType, actorId } 
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error("Delete failed", { description: error.message || "Failed to delete post. Please try again.", duration: 5000 });
      return { success: false, error };
    }
  };

  return { deletePost };
};
