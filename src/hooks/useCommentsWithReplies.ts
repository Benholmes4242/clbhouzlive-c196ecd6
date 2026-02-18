/**
 * useCommentsWithReplies - Enhanced comments hook with likes and single-level replies
 * Supports actor-aware comments (personal and business profiles)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { createMentionNotifications } from '@/utils/mentionExtractor';
import { useActiveActor } from '@/context/ActiveActorContext';

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
  likes_count: number;
  has_liked: boolean;
  replies: CommentReply[];
  replies_count: number;
}

export function useCommentsWithReplies(postId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  
  const actorType = activeActor?.type || 'personal';
  const actorId = activeActor?.id || user?.id || '';

  // Fetch comments with replies and likes
  const { data: comments = [], isLoading: commentsLoading, refetch } = useQuery({
    queryKey: ['post-comments-with-replies', postId],
    enabled: !!postId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      if (!postId) return [];

      // Fetch all comments for this post (including actor info)
      const { data: allComments, error } = await supabase
        .from('post_comments')
        .select('id, user_id, actor_type, actor_id, content, created_at, updated_at, parent_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      // Get unique user IDs and business IDs
      const personalComments = allComments?.filter(c => c.actor_type === 'personal' || !c.actor_type) || [];
      const businessComments = allComments?.filter(c => c.actor_type === 'business') || [];
      
      const userIds = [...new Set(personalComments.map(c => c.actor_id || c.user_id))];
      const businessIds = [...new Set(businessComments.map(c => c.actor_id))];
      
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch business profiles for business actor comments
      let businessMap = new Map<string, { name: string; logo_url: string | null }>();
      if (businessIds.length > 0) {
        const { data: businesses } = await supabase
          .from('business_accounts')
          .select('id, name, logo_url')
          .in('id', businessIds);
        
        businessMap = new Map(businesses?.map(b => [b.id, b]) || []);
      }

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

      // Helper to get name/avatar based on actor type
      const getActorInfo = (comment: typeof allComments[0]) => {
        const commentActorType = (comment.actor_type || 'personal') as 'personal' | 'business';
        const commentActorId = comment.actor_id || comment.user_id;
        
        if (commentActorType === 'business') {
          const business = businessMap.get(commentActorId);
          return {
            actor_type: 'business' as const,
            actor_id: commentActorId,
            user_name: business?.name || 'Business',
            avatar_url: business?.logo_url || null,
          };
        } else {
          const profile = profileMap.get(commentActorId);
          return {
            actor_type: 'personal' as const,
            actor_id: commentActorId,
            user_name: profile?.display_name || 'User',
            avatar_url: profile?.profile_photo_url || null,
          };
        }
      };

      // Separate parent comments and replies
      const parentComments = allComments?.filter(c => !c.parent_id) || [];
      const replies = allComments?.filter(c => c.parent_id) || [];

      // Build comment tree with actor info
      const enrichedComments: CommentWithReplies[] = parentComments.map(comment => {
        const actorInfo = getActorInfo(comment);
        const commentReplies: CommentReply[] = replies
          .filter(r => r.parent_id === comment.id)
          .map(reply => {
            const replyActorInfo = getActorInfo(reply);
            return {
              id: reply.id,
              user_id: reply.user_id,
              actor_type: replyActorInfo.actor_type,
              actor_id: replyActorInfo.actor_id,
              user_name: replyActorInfo.user_name,
              avatar_url: replyActorInfo.avatar_url,
              content: reply.content,
              created_at: reply.created_at,
              updated_at: reply.updated_at,
              likes_count: likesCount.get(reply.id) || 0,
              has_liked: userLikes.has(reply.id),
            };
          });

        return {
          id: comment.id,
          user_id: comment.user_id,
          actor_type: actorInfo.actor_type,
          actor_id: actorInfo.actor_id,
          user_name: actorInfo.user_name,
          avatar_url: actorInfo.avatar_url,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
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
  // Uses active actor context for actor_type and actor_id
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }): Promise<string> => {
      if (!postId || !user?.id) throw new Error('Missing postId or user');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id, // Always the auth user for RLS
          content,
          parent_id: parentId || null,
          actor_type: actorType,
          actor_id: actorId,
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Create mention notifications for any @mentions in the comment
      await createMentionNotifications(content, user.id, 'comment', data.id, postId);
      
      // If this is a reply, notify the parent comment's author
      if (parentId) {
        // Get the parent comment's actor info
        const { data: parentComment } = await supabase
          .from('post_comments')
          .select('user_id, actor_type, actor_id')
          .eq('id', parentId)
          .single();

        if (parentComment) {
          const parentActorType = (parentComment.actor_type || 'personal') as 'personal' | 'business';
          const parentActorId = parentComment.actor_id || parentComment.user_id;
          
          // Don't notify yourself
          if (parentActorId !== actorId) {
            // If parent is a business, get an owner for user_id (legacy)
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

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // RLS safety belt

      if (error) throw error;

      // Recount remaining comments and sync the denormalised column
      const { count } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId!);

      await supabase
        .from('posts')
        .update({ comment_count: count ?? 0 })
        .eq('id', postId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments-with-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['post-engagement', postId] });
    },
  });

  // Update (edit) comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('post_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', user.id); // RLS safety belt

      if (error) throw error;

      // Re-extract mentions from updated content
      await createMentionNotifications(content, user.id, 'comment', commentId, postId!);
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
  };
}
