import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { createMentionNotifications } from '@/utils/mentionExtractor';
import { useActiveActor } from '@/context/ActiveActorContext';
import { patchEngagement } from '@/lib/engagementCache';

export interface PostComment {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  actor_type: 'personal' | 'business';
  actor_id: string;
}

export function usePostEngagement(postId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();

  // Get current actor context
  const actorType = activeActor?.type || 'personal';
  const actorId = activeActor?.id || user?.id || '';

  // 1) Fetch engagement summary (likes + comments counts + user state)
  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ['post-engagement', postId, actorType, actorId],
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
        .eq('post_id', postId)
        .is('deleted_at', null);

      if (commentsError) console.error('Error fetching comments count:', commentsError);

      // Check if current ACTOR has liked this post (actor-aware)
      let hasLiked = false;
      if (actorId) {
        const { data: myLike, error: likeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('actor_type', actorType)
          .eq('actor_id', actorId)
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

  // Helper to get post owner ID and actor info
  const getPostOwnerInfo = async (): Promise<{ userId: string; actorType: string; actorId: string } | null> => {
    if (!postId) return null;
    const { data } = await supabase
      .from('posts')
      .select('user_id, actor_type, actor_id')
      .eq('id', postId)
      .single();
    if (!data) return null;
    return {
      userId: data.user_id,
      actorType: data.actor_type || 'personal',
      actorId: data.actor_id || data.user_id,
    };
  };

  // 2) Like toggle mutation (actor-aware)
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');
      
      const currentlyLiked = engagementData?.hasLiked;

      if (currentlyLiked) {
        // Unlike - delete based on actor
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('actor_type', actorType)
          .eq('actor_id', actorId);
      } else {
        // Like - insert with actor context
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id, // Always the auth user (for audit/RLS)
            actor_type: actorType,
            actor_id: actorId,
          });

        // Create notification for post owner (only on like, not unlike)
        const postOwnerInfo = await getPostOwnerInfo();
        if (postOwnerInfo) {
          // Notify the post owner - use their actor context as recipient
          const recipientActorType = postOwnerInfo.actorType;
          const recipientActorId = postOwnerInfo.actorId;
          
          // Don't notify self (same actor)
          if (!(recipientActorType === actorType && recipientActorId === actorId)) {
            await supabase.from('notifications').insert({
              user_id: postOwnerInfo.userId, // For legacy compatibility
              recipient_actor_type: recipientActorType,
              recipient_actor_id: recipientActorId,
              actor_id: actorId, // Who performed the action
              type: 'like',
              title: 'New like',
              message: 'liked your post',
              entity_type: 'post',
              entity_id: postId,
              data: { 
                post_id: postId,
                liker_actor_type: actorType,
                liker_actor_id: actorId,
              },
            });
          }
        }
      }
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['post-engagement', postId, actorType, actorId] });
      const prev = queryClient.getQueryData<any>(['post-engagement', postId, actorType, actorId]);

      const wasLiked = !!prev?.hasLiked;

      if (prev) {
        const next = {
          ...prev,
          hasLiked: !prev.hasLiked,
          likesCount: prev.likesCount + (prev.hasLiked ? -1 : 1),
        };
        queryClient.setQueryData(['post-engagement', postId, actorType, actorId], next);
      }

      return { prev, wasLiked };
    },
    onError: (_err, _vars, ctx) => {
      // Revert on error
      if (ctx?.prev) {
        queryClient.setQueryData(['post-engagement', postId, actorType, actorId], ctx.prev);
      }
    },
    onSettled: (_data, _error, _vars, ctx) => {
      // Surgical cache patch across every OTHER feed surface. The
      // `['post-engagement', postId, actorType, actorId]` entry was already
      // updated optimistically in onMutate; patchEngagement will reapply
      // the +/-1 delta to any other variant of the post-engagement key (other
      // actors viewing the same post) and to all feed caches.
      // Use the pre-toggle state from context to compute the correct delta.
      if (postId && ctx) {
        const wasLiked = ctx.wasLiked;
        patchEngagement(queryClient, postId, {
          isLikedByMe: !wasLiked,
          likeCountDelta: wasLiked ? -1 : +1,
        });
      }
    },
  });
  });

  // 3) Comments list query (now includes actor info)
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
          created_at,
          actor_type,
          actor_id
        `)
        .eq('post_id', postId)
        .is('deleted_at', null)
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

      // Also fetch business profiles for business actors
      const businessActorIds = comments
        .filter(c => c.actor_type === 'business')
        .map(c => c.actor_id);
      
      let businessMap = new Map<string, { name: string; logo_url: string | null }>();
      if (businessActorIds.length > 0) {
        const { data: businesses } = await supabase
          .from('business_accounts')
          .select('id, name, logo_url')
          .in('id', businessActorIds);
        
        businessMap = new Map(
          (businesses || []).map(b => [b.id, { name: b.name, logo_url: b.logo_url }])
        );
      }

      // Create lookup map for personal profiles
      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // Enrich comments with profile data from map
      const enrichedComments: PostComment[] = comments.map((comment) => {
        let userName = 'User';
        let avatarUrl: string | null = null;

        if (comment.actor_type === 'business') {
          const business = businessMap.get(comment.actor_id);
          if (business) {
            userName = business.name;
            avatarUrl = business.logo_url;
          }
        } else {
          const profile = profileMap.get(comment.user_id);
          if (profile) {
            userName = profile.display_name || 'User';
            avatarUrl = profile.profile_photo_url;
          }
        }

        return {
          id: comment.id,
          user_id: comment.user_id,
          user_name: userName,
          avatar_url: avatarUrl,
          content: comment.content,
          created_at: comment.created_at,
          actor_type: comment.actor_type as 'personal' | 'business',
          actor_id: comment.actor_id,
        };
      });

      return enrichedComments;
    },
  });

  // 4) Add comment mutation (actor-aware)
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');
      
      const { data: newComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id, // Always the auth user (for audit/RLS)
          content,
          actor_type: actorType,
          actor_id: actorId,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create notification for post owner
      const postOwnerInfo = await getPostOwnerInfo();
      if (postOwnerInfo) {
        const recipientActorType = postOwnerInfo.actorType;
        const recipientActorId = postOwnerInfo.actorId;
        
        // Don't notify self (same actor)
        if (!(recipientActorType === actorType && recipientActorId === actorId)) {
          await supabase.from('notifications').insert({
            user_id: postOwnerInfo.userId, // For legacy compatibility
            recipient_actor_type: recipientActorType,
            recipient_actor_id: recipientActorId,
            actor_id: actorId, // Who performed the action
            type: 'comment',
            title: 'New comment',
            message: 'commented on your post',
            entity_type: 'post',
            entity_id: postId,
            data: { 
              post_id: postId, 
              comment_id: newComment?.id,
              comment_preview: content.slice(0, 100),
              commenter_actor_type: actorType,
              commenter_actor_id: actorId,
            },
          });
        }
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
