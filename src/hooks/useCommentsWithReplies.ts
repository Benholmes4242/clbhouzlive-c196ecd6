/**
 * useCommentsWithReplies - Enhanced comments hook with likes and single-level replies
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { createMentionNotifications } from '@/utils/mentionExtractor';

export interface CommentReply {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  likes_count: number;
  has_liked: boolean;
}

export interface CommentWithReplies {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  likes_count: number;
  has_liked: boolean;
  replies: CommentReply[];
  replies_count: number;
}

export function useCommentsWithReplies(postId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  // Fetch comments with replies and likes
  const { data: comments = [], isLoading: commentsLoading, refetch } = useQuery({
    queryKey: ['post-comments-with-replies', postId],
    enabled: !!postId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!postId) return [];

      // Fetch all comments for this post
      const { data: allComments, error } = await supabase
        .from('post_comments')
        .select('id, user_id, content, created_at, parent_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(allComments?.map(c => c.user_id) || [])];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch comment likes counts
      const commentIds = allComments?.map(c => c.id) || [];
      const { data: likesData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds);

      // Count likes per comment
      const likesCount = new Map<string, number>();
      likesData?.forEach(like => {
        likesCount.set(like.comment_id, (likesCount.get(like.comment_id) || 0) + 1);
      });

      // Check which comments current user has liked
      let userLikes = new Set<string>();
      if (user?.id) {
        const { data: myLikes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('user_id', user.id);
        
        userLikes = new Set(myLikes?.map(l => l.comment_id) || []);
      }

      // Separate parent comments and replies
      const parentComments = allComments?.filter(c => !c.parent_id) || [];
      const replies = allComments?.filter(c => c.parent_id) || [];

      // Build comment tree
      const enrichedComments: CommentWithReplies[] = parentComments.map(comment => {
        const profile = profileMap.get(comment.user_id);
        const commentReplies = replies
          .filter(r => r.parent_id === comment.id)
          .map(reply => {
            const replyProfile = profileMap.get(reply.user_id);
            return {
              id: reply.id,
              user_id: reply.user_id,
              user_name: replyProfile?.display_name || 'User',
              avatar_url: replyProfile?.profile_photo_url || null,
              content: reply.content,
              created_at: reply.created_at,
              likes_count: likesCount.get(reply.id) || 0,
              has_liked: userLikes.has(reply.id),
            };
          });

        return {
          id: comment.id,
          user_id: comment.user_id,
          user_name: profile?.display_name || 'User',
          avatar_url: profile?.profile_photo_url || null,
          content: comment.content,
          created_at: comment.created_at,
          likes_count: likesCount.get(comment.id) || 0,
          has_liked: userLikes.has(comment.id),
          replies: commentReplies,
          replies_count: commentReplies.length,
        };
      });

      return enrichedComments;
    },
  });

  // Add comment mutation - returns the new comment ID
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }): Promise<string> => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
          actor_type: 'personal',
          actor_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Create mention notifications for any @mentions in the comment
      await createMentionNotifications(content, user.id, 'comment', data.id, postId);
      
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Toggle comment like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existing } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
    },
  });

  return {
    comments,
    commentsLoading,
    addComment: (content: string, parentId?: string): Promise<string> => 
      addCommentMutation.mutateAsync({ content, parentId }),
    isAddingComment: addCommentMutation.isPending,
    toggleCommentLike: (commentId: string) => toggleLikeMutation.mutate(commentId),
    isTogglingLike: toggleLikeMutation.isPending,
    refetchComments: refetch,
  };
}
