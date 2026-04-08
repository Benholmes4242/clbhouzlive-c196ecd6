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
      // First delete associated media
      const { error: mediaError } = await supabase
        .from('post_media')
        .delete()
        .eq('post_id', postId);

      if (mediaError) {
        console.error('Error deleting post media:', mediaError);
        throw new Error(`Failed to delete post media: ${mediaError.message}`);
      }

      // Then delete associated tags
      const { error: tagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      if (tagsError) {
        console.error('Error deleting post tags:', tagsError);
        throw new Error(`Failed to delete post tags: ${tagsError.message}`);
      }

      // Finally delete the post
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (postError) {
        console.error('Error deleting post:', postError);
        throw new Error(`Failed to delete post: ${postError.message}`);
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
