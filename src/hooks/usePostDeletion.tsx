
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePostDeletion = () => {
  const { toast } = useToast();

  const deletePost = async (postId: string) => {
    try {
      console.log('Attempting to delete post:', postId);
      
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

      console.log('Post deleted successfully:', postId);

      // Show delete notification
      toast({
        title: "Post deleted",
        duration: 2000
      });

      // Broadcast delete event for UI cleanup and feed refresh
      window.dispatchEvent(new CustomEvent('postDeleted', { 
        detail: { postId } 
      }));

      // Also broadcast a general feed refresh event
      window.dispatchEvent(new CustomEvent('refreshFeed'));

    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  return { deletePost };
};
