/**
 * useCommentsWithReplies - Enhanced comments hook with cursor-based pagination,
 * likes, and single-level replies. Supports actor-aware comments.
 * Uses create-comment edge function for validation + rate limiting.
 */
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from 'sonner';

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
  media_url?: string | null;
  media_type?: string | null;
  voice_duration_seconds?: number | null;
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
  media_url?: string | null;
  media_type?: string | null;
  voice_duration_seconds?: number | null;
}

interface PageData {
  comments: CommentWithReplies[];
  nextCursor: string | null;
}

export function useCommentsWithReplies(postId: string | null, onCommentDeleted?: () => void) {
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
    const userIds = [...new Set(
      personalComments
        .map(c => c.actor_id || c.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )];
    const businessIds = [...new Set(
      businessComments
        .map(c => c.actor_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )];

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
          media_url: reply.media_url, media_type: reply.media_type,
          voice_duration_seconds: reply.voice_duration_seconds,
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
        media_url: comment.media_url, media_type: comment.media_type,
        voice_duration_seconds: comment.voice_duration_seconds,
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
        .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id, is_edited, media_url, media_type, voice_duration_seconds')
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

      // Fetch first N replies per parent
      const { data: allReplies } = await supabase
        .from('post_comments')
        .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id, is_edited, media_url, media_type, voice_duration_seconds')
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
      .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id, is_edited, media_url, media_type, voice_duration_seconds')
      .eq('parent_id', commentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!allReplies?.length) return;

    // Enrich the replies via a synthetic parent that carries valid actor
    // fields so it can't poison the profile batch query. We discard the
    // synthetic parent and only use its enriched .replies array.
    const syntheticParent = {
      id: commentId,
      user_id: allReplies[0].user_id,
      actor_type: allReplies[0].actor_type,
      actor_id: allReplies[0].actor_id,
      parent_id: null,
      _total_replies_count: allReplies.length,
    };
    // Temporarily mark all replies as belonging to syntheticParent so
    // enrichComments groups them under it, then we extract.
    const repliesForEnrichment = allReplies.map(r => ({ ...r, parent_id: commentId }));
    const enriched = await enrichComments([syntheticParent], repliesForEnrichment, user?.id);
    const enrichedReplies = enriched[0]?.replies ?? [];

    // Update cache — replace ONLY the parent's replies array + counts.
    // Do NOT overwrite the parent's own author/avatar/display_name fields.
    queryClient.setQueryData(['post-comments-with-replies', postId], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: PageData) => ({
          ...page,
          comments: page.comments.map((c: CommentWithReplies) =>
            c.id === commentId
              ? { ...c, replies: enrichedReplies, replies_count: allReplies.length, total_replies_count: allReplies.length }
              : c
          ),
        })),
      };
    });
  }, [postId, user?.id, queryClient, enrichComments]);

  // Add comment mutation — uses create-comment edge function
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId, mediaUrl, mediaType, voiceDurationSeconds }: {
      content: string;
      parentId?: string;
      mediaUrl?: string;
      mediaType?: string;
      voiceDurationSeconds?: number;
    }): Promise<string> => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');

      const { data, error } = await supabase.functions.invoke('create-comment', {
        body: {
          postId,
          content,
          parentId: parentId || null,
          actorType: actorType,
          actorId: actorId,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          voiceDurationSeconds: voiceDurationSeconds || null,
        }
      });

      if (error) {
        // Parse edge function error
        const message = error.message || 'Failed to post comment';
        throw new Error(message);
      }

      if (data?.error) {
        // Edge function returned an error in body
        const msg = data.error;
        if (msg.includes('Rate limited')) {
          toast.error('Slow down — you can post up to 5 comments per minute');
        } else if (msg.includes('empty')) {
          toast.error("Comment can't be empty");
        } else if (msg.includes('too long')) {
          toast.error('Comment is too long (max 2,000 characters)');
        }
        throw new Error(msg);
      }

      const newCommentId = data.id;
      const currentUserId = user.id;

      // ── Mention notifications (non-blocking) ─────────────────────
      try {
        const mentionMatches = content.match(/@([\w]+(?:\s[\w]+)*)/g) ?? [];
        for (const match of mentionMatches) {
          const username = match.slice(1).trim();
          const { data: mentionedUser } = await supabase
            .from('user_profiles')
            .select('id, username')
            .eq('username', username)
            .single();
          if (!mentionedUser) continue;
          if (mentionedUser.id === currentUserId) continue;

          const { data: commenterProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', currentUserId)
            .single();
          const commenterName = commenterProfile?.display_name ?? 'Someone';

          await supabase.from('notifications').insert({
            user_id: mentionedUser.id,
            recipient_actor_type: 'personal',
            recipient_actor_id: mentionedUser.id,
            actor_id: currentUserId,
            type: 'mention',
            title: `${commenterName} mentioned you in a comment`,
            message: content.length > 60 ? content.slice(0, 60) + '…' : content,
            entity_type: 'comment',
            entity_id: newCommentId,
            is_read: false,
            data: { post_id: postId },
          });
        }
      } catch {
        // Mention notifications are non-blocking
      }

      // Handle reply notifications client-side (edge function doesn't do this yet)
      if (parentId) {
        const { data: replierProfile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', currentUserId)
          .single();
        const commenterName = replierProfile?.display_name ?? 'Someone';
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
              title: `${commenterName} replied to your comment`,
              message: content.length > 60 ? content.slice(0, 60) + '…' : content,
              entity_type: 'comment',
              entity_id: newCommentId,
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

      // ── Top-level comment notification to post owner (non-blocking) ──
      try {
        if (!parentId && postId) {
          const { data: postData } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();
          const postOwnerId = postData?.user_id;

          if (postOwnerId && postOwnerId !== currentUserId) {
            const { data: commenterProfile } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('id', currentUserId)
              .single();
            const commenterName = commenterProfile?.display_name ?? 'Someone';

            await supabase.from('notifications').insert({
              user_id: postOwnerId,
              recipient_actor_type: 'personal',
              recipient_actor_id: postOwnerId,
              actor_id: currentUserId,
              type: 'comment',
              title: `${commenterName} commented on your post`,
              message: content.length > 60 ? content.slice(0, 60) + '…' : content,
              entity_type: 'post',
              entity_id: postId,
              is_read: false,
            });
          }
        }
      } catch {
        // Non-blocking
      }

      return newCommentId;
    },
    onMutate: async ({ content, parentId, mediaUrl, mediaType, voiceDurationSeconds }) => {
      // Optimistic insert
      await queryClient.cancelQueries({ queryKey: ['post-comments-with-replies', postId] });
      const prev = queryClient.getQueryData(['post-comments-with-replies', postId]);

      // Resolve real name + avatar for the optimistic comment
      let optimisticName = 'You';
      let optimisticAvatar: string | null = null;

      if (actorType === 'business') {
        const { data: biz } = await supabase
          .from('business_accounts')
          .select('name, logo_url')
          .eq('id', actorId)
          .single();
        if (biz) { optimisticName = biz.name; optimisticAvatar = biz.logo_url; }
      } else if (user?.id) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, profile_photo_url')
          .eq('id', user.id)
          .single();
        if (profile) {
          optimisticName = profile.display_name || 'You';
          optimisticAvatar = profile.profile_photo_url || null;
        }
      }

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticComment: CommentWithReplies = {
        id: optimisticId,
        user_id: user?.id || '',
        actor_type: actorType as 'personal' | 'business',
        actor_id: actorId,
        user_name: optimisticName,
        avatar_url: optimisticAvatar,
        content,
        created_at: new Date().toISOString(),
        likes_count: 0,
        has_liked: false,
        replies: [],
        replies_count: 0,
        total_replies_count: 0,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        voice_duration_seconds: voiceDurationSeconds || null,
      };

      if (!parentId) {
        queryClient.setQueryData(['post-comments-with-replies', postId], (old: any) => {
          if (!old?.pages?.length) return { pages: [{ comments: [optimisticComment], nextCursor: null }], pageParams: [null] };
          const pages = [...old.pages];
          const lastPage = { ...pages[pages.length - 1] };
          lastPage.comments = [...lastPage.comments, optimisticComment];
          pages[pages.length - 1] = lastPage;
          return { ...old, pages };
        });
      }

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['post-comments-with-replies', postId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ['post-comments-with-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'friends'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['real-posts'] });
      queryClient.invalidateQueries({ queryKey: ['actor-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      queryClient.invalidateQueries({ queryKey: ['watch-feed'] });
    },
  });

  // Toggle comment like with optimistic update
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
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['post-comments-with-replies', postId] });
      const prev = queryClient.getQueryData(['post-comments-with-replies', postId]);

      // Optimistically toggle like
      queryClient.setQueryData(['post-comments-with-replies', postId], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: PageData) => ({
            ...page,
            comments: page.comments.map((c: CommentWithReplies) => {
              if (c.id === commentId) {
                return {
                  ...c,
                  has_liked: !c.has_liked,
                  likes_count: c.has_liked ? c.likes_count - 1 : c.likes_count + 1,
                };
              }
              // Check replies
              return {
                ...c,
                replies: c.replies.map((r: CommentReply) =>
                  r.id === commentId
                    ? { ...r, has_liked: !r.has_liked, likes_count: r.has_liked ? r.likes_count - 1 : r.likes_count + 1 }
                    : r
                ),
              };
            }),
          })),
        };
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['post-comments-with-replies', postId], context.prev);
      }
    },
    onSettled: () => {
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
      onCommentDeleted?.();
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

      // Re-extract mentions via edge function is not needed for edits since
      // the edge function only handles creation. Client-side mention cleanup:
      await supabase.from('comment_mentions').delete().eq('comment_id', commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
    },
  });

  return {
    comments,
    commentsLoading,
    addComment: (content: string, parentId?: string, opts?: { mediaUrl?: string; mediaType?: string; voiceDurationSeconds?: number }): Promise<string> =>
      addCommentMutation.mutateAsync({ content, parentId, ...opts }),
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
