import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GolfReactionType } from '@/components/comments/GolfReactionPicker';

interface ReactionData {
  comment_id: string;
  reaction_type: string;
  user_id: string;
}

export function useCommentReactions(postId: string, userId?: string) {
  const queryClient = useQueryClient();
  
  // Fetch all reactions for comments in this post
  const { data: reactionsMap = new Map(), isLoading } = useQuery({
    queryKey: ['comment-reactions', postId],
    queryFn: async () => {
      // First get all comment IDs for this post
      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select('id')
        .eq('post_id', postId);
      
      if (commentsError) throw commentsError;
      if (!comments || comments.length === 0) return new Map();
      
      const commentIds = comments.map(c => c.id);
      
      // Get all reactions for these comments
      const { data: reactionCounts, error: countError } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type, user_id')
        .in('comment_id', commentIds);
      
      if (countError) throw countError;
      
      // Process into grouped counts
      const grouped = new Map<string, Map<GolfReactionType, { count: number; userHasReacted: boolean }>>();
      
      (reactionCounts as ReactionData[] | null)?.forEach(r => {
        if (!grouped.has(r.comment_id)) {
          grouped.set(r.comment_id, new Map());
        }
        const commentReactions = grouped.get(r.comment_id)!;
        
        const existing = commentReactions.get(r.reaction_type as GolfReactionType) || { count: 0, userHasReacted: false };
        existing.count++;
        if (r.user_id === userId) {
          existing.userHasReacted = true;
        }
        commentReactions.set(r.reaction_type as GolfReactionType, existing);
      });
      
      return grouped;
    },
    enabled: !!postId,
    staleTime: 10000, // 10 seconds
  });
  
  // Toggle a reaction
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ commentId, reactionType }: { commentId: string; reactionType: GolfReactionType }) => {
      if (!userId) throw new Error('Must be logged in');
      
      // Check if reaction exists
      const { data: existing } = await supabase
        .from('comment_reactions')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .single();
      
      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: userId,
            reaction_type: reactionType,
          });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-reactions', postId] });
    },
  });
  
  // Helper to get reactions for a specific comment
  const getReactionsForComment = (commentId: string) => {
    const commentReactions = reactionsMap.get?.(commentId);
    if (!commentReactions) return { reactions: [], userReactions: [] };
    
    const reactionsList: { type: GolfReactionType; count: number }[] = [];
    const userReactions: GolfReactionType[] = [];
    
    commentReactions.forEach((value, type) => {
      reactionsList.push({ type, count: value.count });
      if (value.userHasReacted) {
        userReactions.push(type);
      }
    });
    
    return { reactions: reactionsList, userReactions };
  };
  
  return {
    reactionsMap,
    isLoading,
    toggleReaction: toggleReactionMutation.mutate,
    isToggling: toggleReactionMutation.isPending,
    getReactionsForComment,
  };
}
