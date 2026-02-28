/**
 * useCaddiePick - Hook for managing Caddie's Pick comments
 * Allows post authors to highlight a single comment as their "Caddie's Pick"
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useCaddiePick(postId: string) {
  const queryClient = useQueryClient();

  const setCaddiePickMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('posts')
        .update({ caddie_pick_comment_id: commentId })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
      toast.success("Caddie's Pick set");
    },
    onError: (error) => {
      console.error('Failed to set Caddie\'s Pick:', error);
      toast.error("Couldn't set Caddie's Pick");
    },
  });

  const removeCaddiePickMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('posts')
        .update({ caddie_pick_comment_id: null })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
      toast.success("Caddie's Pick removed");
    },
    onError: (error) => {
      console.error('Failed to remove Caddie\'s Pick:', error);
      toast.error("Failed to remove Caddie's Pick");
    },
  });

  return {
    setCaddiePick: setCaddiePickMutation.mutate,
    removeCaddiePick: removeCaddiePickMutation.mutate,
    isSettingCaddiePick: setCaddiePickMutation.isPending,
    isRemovingCaddiePick: removeCaddiePickMutation.isPending,
  };
}
