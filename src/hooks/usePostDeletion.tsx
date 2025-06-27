
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/utils/toast';

export const usePostDeletion = () => {
  const { toast } = useToast();

  const deletePost = async (postId: string) => {
    try {
      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Show delete toast
      showToast("Post deleted");

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
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  return { deletePost };
};
