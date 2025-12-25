/**
 * useHiddenComments - Hook for managing soft-hidden reported comments
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export interface HiddenComment {
  id: string;
  user_id: string;
  comment_id: string;
  post_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}

export function useHiddenComments(postId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  // Fetch hidden comments for current user and post
  const { data: hiddenCommentIds = new Set<string>(), isLoading } = useQuery({
    queryKey: ['hidden-comments', postId, user?.id],
    enabled: !!postId && !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      if (!postId || !user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('hidden_comments')
        .select('comment_id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching hidden comments:', error);
        return new Set<string>();
      }

      return new Set(data?.map(h => h.comment_id) || []);
    },
  });

  // Hide comment mutation (called after reporting)
  const hideCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason, details }: { commentId: string; reason: string; details?: string }) => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');

      const { error } = await supabase
        .from('hidden_comments')
        .insert({
          user_id: user.id,
          comment_id: commentId,
          post_id: postId,
          reason,
          details: details || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-comments', postId, user?.id] });
    },
  });

  // Unhide comment mutation (optional - for undo functionality)
  const unhideCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('hidden_comments')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-comments', postId, user?.id] });
    },
  });

  return {
    hiddenCommentIds,
    isLoading,
    hideComment: (commentId: string, reason: string, details?: string) =>
      hideCommentMutation.mutate({ commentId, reason, details }),
    isHiding: hideCommentMutation.isPending,
    unhideComment: (commentId: string) => unhideCommentMutation.mutate(commentId),
    isUnhiding: unhideCommentMutation.isPending,
  };
}
