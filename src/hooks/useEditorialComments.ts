/**
 * useEditorialComments — Comments hook for editorial cards.
 * Reads/writes to editorial_card_comments instead of post_comments.
 * Provides the same interface shape as useCommentsWithReplies for CommentsSheet compatibility.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';
import type { CommentWithReplies } from './useCommentsWithReplies';

export function useEditorialComments(cardId: string, onCommentDeleted?: () => void) {
  const { user } = useSupabaseSession();
  const currentUserId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ['editorial-card-comments', cardId];

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey,
    enabled: !!cardId,
    staleTime: 0,
    queryFn: async () => {
      // Fetch top-level comments
      const { data, error } = await supabase
        .from('editorial_card_comments')
        .select('id, content, user_id, parent_id, created_at, updated_at, deleted_at')
        .eq('card_id', cardId)
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [] as CommentWithReplies[];

      // Fetch all replies for this card
      const { data: replies } = await supabase
        .from('editorial_card_comments')
        .select('id, content, user_id, parent_id, created_at, updated_at, deleted_at')
        .eq('card_id', cardId)
        .not('parent_id', 'is', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      // Fetch profiles for all user_ids
      const allComments = [...data, ...(replies || [])];
      const allUserIds = [...new Set(allComments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', allUserIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Fetch like counts for all comments
      const allCommentIds = allComments.map(c => c.id);
      const { data: likeCounts } = await supabase
        .from('editorial_card_comment_likes')
        .select('comment_id')
        .in('comment_id', allCommentIds);

      const likeCountMap = new Map<string, number>();
      for (const row of (likeCounts ?? [])) {
        likeCountMap.set(row.comment_id, (likeCountMap.get(row.comment_id) ?? 0) + 1);
      }

      // Fetch current user's likes
      let userLikedIds = new Set<string>();
      if (currentUserId) {
        const { data: userLikes } = await supabase
          .from('editorial_card_comment_likes')
          .select('comment_id')
          .in('comment_id', allCommentIds)
          .eq('user_id', currentUserId);
        userLikedIds = new Set((userLikes ?? []).map(l => l.comment_id));
      }

      const replyMap = new Map<string, typeof data>();
      for (const r of (replies || [])) {
        const arr = replyMap.get(r.parent_id!) || [];
        arr.push(r);
        replyMap.set(r.parent_id!, arr);
      }

      return data.map((c): CommentWithReplies => {
        const profile = profileMap.get(c.user_id);
        const childReplies = replyMap.get(c.id) || [];
        return {
          id: c.id,
          user_id: c.user_id,
          actor_type: 'personal',
          actor_id: c.user_id,
          user_name: profile?.display_name || 'Golfer',
          avatar_url: profile?.profile_photo_url || null,
          content: c.content,
          created_at: c.created_at,
          updated_at: c.updated_at ?? undefined,
          is_edited: false,
          likes_count: likeCountMap.get(c.id) ?? 0,
          has_liked: userLikedIds.has(c.id),
          replies_count: childReplies.length,
          total_replies_count: childReplies.length,
          replies: childReplies.map(r => {
            const rp = profileMap.get(r.user_id);
            return {
              id: r.id,
              user_id: r.user_id,
              actor_type: 'personal' as const,
              actor_id: r.user_id,
              user_name: rp?.display_name || 'Golfer',
              avatar_url: rp?.profile_photo_url || null,
              content: r.content,
              created_at: r.created_at,
              updated_at: r.updated_at ?? undefined,
              is_edited: false,
              likes_count: likeCountMap.get(r.id) ?? 0,
              has_liked: userLikedIds.has(r.id),
            };
          }),
          media_url: null,
          media_type: null,
          voice_duration_seconds: null,
        };
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }): Promise<string> => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('editorial_card_comments')
        .insert({
          card_id: cardId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['editorial-card-comments-count', cardId] });
    },
    onError: () => {
      toast.error('Failed to post comment');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('editorial_card_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['editorial-card-comments-count', cardId] });
      queryClient.refetchQueries({ queryKey });
      onCommentDeleted?.();
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });

  const toggleCommentLike = useCallback(async (commentId: string) => {
    if (!currentUserId) return;

    // Find current like state from comments data
    const findComment = (list: CommentWithReplies[]): CommentWithReplies | undefined => {
      for (const c of list) {
        if (c.id === commentId) return c;
        const found = c.replies?.find(r => r.id === commentId);
        if (found) return found as unknown as CommentWithReplies;
      }
      return undefined;
    };
    const comment = findComment(comments);
    const currentlyLiked = comment?.has_liked ?? false;

    // Optimistic update
    const updateComments = (list: CommentWithReplies[]): CommentWithReplies[] =>
      list.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            has_liked: !currentlyLiked,
            likes_count: currentlyLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1,
          };
        }
        if (c.replies?.length) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId
                ? {
                    ...r,
                    has_liked: !currentlyLiked,
                    likes_count: currentlyLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1,
                  }
                : r
            ),
          };
        }
        return c;
      });

    queryClient.setQueryData(queryKey, (old: CommentWithReplies[] | undefined) =>
      old ? updateComments(old) : []
    );

    try {
      if (currentlyLiked) {
        await supabase
          .from('editorial_card_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('editorial_card_comment_likes')
          .insert({ comment_id: commentId, user_id: currentUserId });
      }
    } catch {
      // Revert on failure
      queryClient.invalidateQueries({ queryKey });
    }
  }, [currentUserId, cardId, queryClient, queryKey, comments]);

  return {
    comments,
    commentsLoading,
    addComment: (content: string, parentId?: string): Promise<string> =>
      addCommentMutation.mutateAsync({ content, parentId }),
    isAddingComment: addCommentMutation.isPending,
    toggleCommentLike,
    deleteComment: (commentId: string) => deleteCommentMutation.mutateAsync(commentId),
    isDeletingComment: deleteCommentMutation.isPending,
    updateComment: async () => {},
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    loadAllReplies: async () => {},
  };
}
