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

      // Optimistically remove the deleted post from the infinite query cache
      // instead of invalidating (which causes seenPostIds ref issues)
      if (actorType && actorId && userId) {
        const profilePostsKey = ['profile-posts', actorType, actorId, userId];
        queryClient.setQueryData(profilePostsKey, (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: (page.posts ?? []).filter((p: any) => p.id !== postId),
            })),
          };
        });
      }
      
      // If we know the actor type/id, optimistically decrement count and invalidate
      if (actorType && actorId) {
        // Instant count decrement — no refetch needed for immediate UI feedback
        const countKey = postKeys.actorPostsCount(actorType, actorId);
        queryClient.setQueryData(countKey, (old: number | undefined) =>
          Math.max((old ?? 1) - 1, 0)
        );
        queryClient.invalidateQueries({ queryKey: postKeys.actorPosts(actorType, actorId) });
        queryClient.invalidateQueries({ queryKey: countKey });
      }
      
      // Invalidate other feed caches (but NOT profile-posts or actor-posts broadly)
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
