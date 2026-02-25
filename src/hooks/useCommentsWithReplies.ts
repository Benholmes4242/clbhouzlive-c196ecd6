/**
 * useCommentsWithReplies - Enhanced comments hook with cursor-based pagination,
 * likes, and single-level replies. Supports actor-aware comments.
 */
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { createMentionNotifications } from '@/utils/mentionExtractor';
import { useActiveActor } from '@/context/ActiveActorContext';

const PAGE_SIZE = 20;
const INITIAL_REPLIES = 3;

export interface CommentReply {
  id: string;
  user_id: string;
  actor_type: 'personal' | 'business';
  actor_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  likes_count: number;
  has_liked: boolean;
}

export interface CommentWithReplies {
  id: string;
  user_id: string;
  actor_type: 'personal' | 'business';
  actor_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  likes_count: number;
  has_liked: boolean;
  replies: CommentReply[];
  replies_count: number;
  /** Total reply count (may exceed replies.length when not all are loaded) */
  total_replies_count: number;
}

interface PageData {
  comments: CommentWithReplies[];
  nextCursor: string | null;
}

export function useCommentsWithReplies(postId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();

  const actorType = activeActor?.type || 'personal';
  const actorId = activeActor?.id || user?.id || '';

  // Helper to enrich raw comments with profiles, likes, and replies
  const enrichComments = useCallback(async (
    parentComments: any[],
    allReplies: any[],
    userId: string | undefined,
  ): Promise<CommentWithReplies[]> => {
    const allComments = [...parentComments, ...allReplies];
    if (allComments.length === 0) return [];

    // Collect actor IDs
    const personalComments = allComments.filter(c => c.actor_type === 'personal' || !c.actor_type);
    const businessComments = allComments.filter(c => c.actor_type === 'business');
    const userIds = [...new Set(personalComments.map(c => c.actor_id || c.user_id))];
    const businessIds = [...new Set(businessComments.map(c => c.actor_id))];

    // Parallel fetches
    const [profilesRes, businessRes, likesRes, myLikesRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from('user_profiles').select('id, display_name, profile_photo_url').in('id', userIds)
        : { data: [] },
      businessIds.length > 0
        ? supabase.from('business_accounts').select('id, name, logo_url').in('id', businessIds)
        : { data: [] },
      supabase.from('comment_likes').select('comment_id').in('comment_id', allComments.map(c => c.id)),
      userId
        ? supabase.from('comment_likes').select('comment_id').in('comment_id', allComments.map(c => c.id)).eq('user_id', userId)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const businessMap = new Map((businessRes.data || []).map(b => [b.id, b]));

    const likesCount = new Map<string, number>();
    (likesRes.data || []).forEach(l => {
      likesCount.set(l.comment_id, (likesCount.get(l.comment_id) || 0) + 1);
    });
    const userLikes = new Set((myLikesRes.data || []).map(l => l.comment_id));

    const getActorInfo = (comment: any) => {
      const cActorType = (comment.actor_type || 'personal') as 'personal' | 'business';
      const cActorId = comment.actor_id || comment.user_id;
      if (cActorType === 'business') {
        const b = businessMap.get(cActorId);
        return { actor_type: 'business' as const, actor_id: cActorId, user_name: b?.name || 'Business', avatar_url: b?.logo_url || null };
      }
      const p = profileMap.get(cActorId);
      return { actor_type: 'personal' as const, actor_id: cActorId, user_name: p?.display_name || 'User', avatar_url: p?.profile_photo_url || null };
    };

    return parentComments.map(comment => {
      const actorInfo = getActorInfo(comment);
      const commentReplies = allReplies.filter(r => r.parent_id === comment.id);
      const enrichedReplies: CommentReply[] = commentReplies.map(reply => {
        const ri = getActorInfo(reply);
        return {
          id: reply.id, user_id: reply.user_id, actor_type: ri.actor_type, actor_id: ri.actor_id,
          user_name: ri.user_name, avatar_url: ri.avatar_url, content: reply.content,
          created_at: reply.created_at, updated_at: reply.updated_at, is_edited: reply.is_edited,
          likes_count: likesCount.get(reply.id) || 0, has_liked: userLikes.has(reply.id),
        };
      });

      return {
        id: comment.id, user_id: comment.user_id, actor_type: actorInfo.actor_type,
        actor_id: actorInfo.actor_id, user_name: actorInfo.user_name, avatar_url: actorInfo.avatar_url,
        content: comment.content, created_at: comment.created_at, updated_at: comment.updated_at,
        is_edited: comment.is_edited,
        likes_count: likesCount.get(comment.id) || 0, has_liked: userLikes.has(comment.id),
        replies: enrichedReplies,
        replies_count: enrichedReplies.length,
        total_replies_count: comment._total_replies_count ?? enrichedReplies.length,
      };
    });
  }, []);

  // Paginated query
  const {
    data,
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<PageData>({
    queryKey: ['post-comments-with-replies', postId],
    enabled: !!postId,
    staleTime: 30_000,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!postId) return { comments: [], nextCursor: null };

      // Fetch top-level comments page
      let query = supabase
        .from('post_comments')
        .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id, is_edited')
        .eq('post_id', postId)
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.gt('created_at', pageParam);
      }

      const { data: parentComments, error } = await query;
      if (error) { console.error('Error fetching comments:', error); return { comments: [], nextCursor: null }; }
      if (!parentComments?.length) return { comments: [], nextCursor: null };

      const parentIds = parentComments.map(c => c.id);

      // Fetch reply counts for these parents
      const { data: replyCounts } = await supabase
        .from('post_comments')
        .select('parent_id')
        .in('parent_id', parentIds)
        .is('deleted_at', null);

      const replyCountMap = new Map<string, number>();
      (replyCounts || []).forEach(r => {
        replyCountMap.set(r.parent_id!, (replyCountMap.get(r.parent_id!) || 0) + 1);
      });

      // Fetch first N replies per parent (using a single query, then slice client-side)
      const { data: allReplies } = await supabase
        .from('post_comments')
        .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id, is_edited')
        .in('parent_id', parentIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      // Limit to INITIAL_REPLIES per parent
      const repliesByParent = new Map<string, any[]>();
      (allReplies || []).forEach(r => {
        const arr = repliesByParent.get(r.parent_id!) || [];
        if (arr.length < INITIAL_REPLIES) arr.push(r);
        repliesByParent.set(r.parent_id!, arr);
      });
      const limitedReplies = Array.from(repliesByParent.values()).flat();

      // Attach total reply count metadata
      const parentsWithMeta = parentComments.map(c => ({
        ...c,
        _total_replies_count: replyCountMap.get(c.id) || 0,
      }));

      const enriched = await enrichComments(parentsWithMeta, limitedReplies, user?.id);

      const nextCursor = parentComments.length === PAGE_SIZE
        ? parentComments[parentComments.length - 1].created_at
        : null;

      return { comments: enriched, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten pages into single array for consumers
  const comments = useMemo(() => {
    return data?.pages.flatMap(p => p.comments) ?? [];
  }, [data]);

  // --- Load all replies for a specific comment ---
  const loadAllReplies = useCallback(async (commentId: string) => {
    if (!postId) return;
    const { data: allReplies } = await supabase
      .from('post_comments')
      .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id, is_edited')
      .eq('parent_id', commentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!allReplies?.length) return;

    // Get the parent from cache
    const enriched = await enrichComments(
      [{ id: commentId, _total_replies_count: allReplies.length }],
      allReplies,
      user?.id,
    );

    // Update cache — replace the comment's replies in place
    queryClient.setQueryData(['post-comments-with-replies', postId], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: PageData) => ({
          ...page,
          comments: page.comments.map((c: CommentWithReplies) =>
            c.id === commentId
              ? { ...c, replies: enriched[0]?.replies ?? c.replies, replies_count: allReplies.length, total_replies_count: allReplies.length }
              : c
          ),
        })),
      };
    });
  }, [postId, user?.id, queryClient, enrichComments]);

  // Add comment mutation
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
          actor_type: actorType,
          actor_id: actorId,
        })
        .select('id')
        .single();

      if (error) throw error;

      await createMentionNotifications(content, user.id, 'comment', data.id, postId);

      if (parentId) {
        const { data: parentComment } = await supabase
          .from('post_comments')
          .select('user_id, actor_type, actor_id')
          .eq('id', parentId)
          .single();

        if (parentComment) {
          const parentActorType = (parentComment.actor_type || 'personal') as 'personal' | 'business';
          const parentActorId = parentComment.actor_id || parentComment.user_id;

          if (parentActorId !== actorId) {
            let legacyUserId = parentComment.user_id;
            if (parentActorType === 'business') {
              const { data: owner } = await supabase
                .from('business_members')
                .select('user_profile_id')
                .eq('business_id', parentActorId)
                .eq('role', 'owner')
                .limit(1)
                .single();
              legacyUserId = owner?.user_profile_id || parentComment.user_id;
            }

            await supabase.from('notifications').insert({
              user_id: legacyUserId,
              recipient_actor_type: parentActorType,
              recipient_actor_id: parentActorId,
              actor_id: actorId,
              type: 'comment_reply',
              title: 'New reply',
              message: 'replied to your comment',
              entity_type: 'comment',
              entity_id: data.id,
              data: {
                post_id: postId,
                parent_comment_id: parentId,
                replier_actor_type: actorType,
                replier_actor_id: actorId,
              },
            });
          }
        }
      }

      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Toggle comment like
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
    },
  });

  // Soft-delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error, data: deletedRows } = await supabase
        .from('post_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .is('deleted_at', null)
        .select('id');

      if (error) throw error;

      if (!deletedRows?.length) {
        console.error('[DELETE] No rows deleted — possible RLS mismatch');
      }

      const { count: remaining } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId!)
        .is('deleted_at', null);

      try {
        await supabase.from('posts').update({ comment_count: remaining ?? 0 }).eq('id', postId!);
      } catch (e) {
        console.warn('[DELETE] comment_count sync failed:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
    },
  });

  // Edit comment
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('post_comments')
        .update({ content, updated_at: new Date().toISOString(), is_edited: true })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await supabase.from('comment_mentions').delete().eq('comment_id', commentId);

      try {
        await createMentionNotifications(content, user.id, 'comment', commentId, postId!);
      } catch (err) {
        console.warn('[useCommentsWithReplies] Mention extraction failed:', err);
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
    deleteComment: (commentId: string) => deleteCommentMutation.mutateAsync(commentId),
    isDeletingComment: deleteCommentMutation.isPending,
    updateComment: (commentId: string, content: string) =>
      updateCommentMutation.mutateAsync({ commentId, content }),
    isUpdatingComment: updateCommentMutation.isPending,
    refetchComments: refetch,
    // Pagination
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    loadAllReplies,
  };
}
