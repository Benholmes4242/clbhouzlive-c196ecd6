import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { createMentionNotifications } from '@/utils/mentionExtractor';

export interface PostComment {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

export function usePostEngagement(postId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();

  // 1) Fetch engagement summary (likes + comments counts + user state)
  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ['post-engagement', postId],
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
    queryFn: async () => {
      if (!postId) return null;

      // Fetch likes count
      const { count: likesCount, error: likesError } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (likesError) console.error('Error fetching likes count:', likesError);

      // Fetch comments count
      const { count: commentsCount, error: commentsError } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (commentsError) console.error('Error fetching comments count:', commentsError);

      // Check if current user has liked this post
      let hasLiked = false;
      if (user?.id) {
        const { data: myLike, error: likeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (likeCheckError) console.error('Error checking like status:', likeCheckError);
        hasLiked = !!myLike;
      }

      return {
        likesCount: likesCount ?? 0,
        commentsCount: commentsCount ?? 0,
        hasLiked,
      };
    },
  });

  // Helper to get post owner ID
  const getPostOwnerId = async (): Promise<string | null> => {
    if (!postId) return null;
    const { data } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
    return data?.user_id ?? null;
  };

  // 2) Like toggle mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');
      
      const currentlyLiked = engagementData?.hasLiked;

      if (currentlyLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        // Create notification for post owner (only on like, not unlike)
        const postOwnerId = await getPostOwnerId();
        if (postOwnerId && postOwnerId !== user.id) {
          await supabase.from('notifications').insert({
            user_id: postOwnerId,
            actor_id: user.id,
            type: 'like',
            title: 'New like',
            message: 'liked your post',
            entity_type: 'post',
            entity_id: postId,
            data: { post_id: postId },
          });
        }
      }
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['post-engagement', postId] });
      const prev = queryClient.getQueryData<any>(['post-engagement', postId]);

      if (!prev) return { prev };

      const next = {
        ...prev,
        hasLiked: !prev.hasLiked,
        likesCount: prev.likesCount + (prev.hasLiked ? -1 : 1),
      };

      queryClient.setQueryData(['post-engagement', postId], next);

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Revert on error
      if (ctx?.prev) {
        queryClient.setQueryData(['post-engagement', postId], ctx.prev);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Invalidate all feed queries to update like counts across pages
      queryClient.invalidateQueries({ queryKey: ['explore-content'] });
      queryClient.invalidateQueries({ queryKey: ['watch-posts'] });
      queryClient.invalidateQueries({ queryKey: ['activity-posts'] });
      queryClient.invalidateQueries({ queryKey: ['course-media'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });

  // 3) Comments list query
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['post-comments', postId],
    enabled: !!postId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          user_id,
          content,
          created_at
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      const comments = data || [];
      if (comments.length === 0) return [];

      // Batch fetch all user profiles at once (not N+1)
      const uniqueUserIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', uniqueUserIds);

      // Create lookup map
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // Enrich comments with profile data from map
      const enrichedComments = comments.map((comment) => {
        const profile = profileMap.get(comment.user_id);
        return {
          id: comment.id,
          user_id: comment.user_id,
          user_name: profile?.display_name || 'User',
          avatar_url: profile?.profile_photo_url || null,
          content: comment.content,
          created_at: comment.created_at,
        };
      });

      return enrichedComments;
    },
  });

  // 4) Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');
      
      const { data: newComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create notification for post owner
      const postOwnerId = await getPostOwnerId();
      if (postOwnerId && postOwnerId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'comment',
          title: 'New comment',
          message: 'commented on your post',
          entity_type: 'post',
          entity_id: postId,
          data: { 
            post_id: postId, 
            comment_id: newComment?.id,
            comment_preview: content.slice(0, 100),
          },
        });
      }

      // Create mention notifications for any @mentions in the comment
      if (newComment?.id) {
        await createMentionNotifications(content, user.id, 'comment', newComment.id, postId);
      }
    },
    onSuccess: () => {
      // Refetch comments and engagement summary
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    // Summary
    likesCount: engagementData?.likesCount ?? 0,
    commentsCount: engagementData?.commentsCount ?? 0,
    hasLiked: engagementData?.hasLiked ?? false,
    isLoading: engagementLoading,

    // Actions
    toggleLike: () => toggleLikeMutation.mutate(),
    isTogglingLike: toggleLikeMutation.isPending,

    // Comments
    comments,
    commentsLoading,
    addComment: (content: string) => addCommentMutation.mutate(content),
    isAddingComment: addCommentMutation.isPending,
  };
}
