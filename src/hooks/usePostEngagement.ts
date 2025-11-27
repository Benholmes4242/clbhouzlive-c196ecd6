import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

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

      // Enrich with user profile data
      const enrichedComments = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, profile_photo_url')
            .eq('id', comment.user_id)
            .single();

          return {
            id: comment.id,
            user_id: comment.user_id,
            user_name: profile?.display_name || 'User',
            avatar_url: profile?.profile_photo_url || null,
            content: comment.content,
            created_at: comment.created_at,
          };
        })
      );

      return enrichedComments;
    },
  });

  // 4) Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');
      
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Refetch comments and engagement summary
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
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
