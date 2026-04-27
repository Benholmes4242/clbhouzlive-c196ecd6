import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

export interface TopTenComment {
  id: string;
  commenter_id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  commenter_name: string;
  commenter_username: string;
  commenter_avatar: string | null;
  replies: TopTenComment[];
}

const mapComment = (c: any): TopTenComment => ({
  id: c.id,
  commenter_id: c.commenter_id,
  body: c.body,
  created_at: c.created_at,
  parent_id: c.parent_id ?? null,
  commenter_name: c.user_profiles?.display_name ?? 'Golfer',
  commenter_username: c.user_profiles?.username ?? '',
  commenter_avatar: c.user_profiles?.profile_photo_url ?? null,
  replies: [],
});

export function useTopTenComments(targetUserId: string, courseId: string) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const qk = ['top-ten-comments', targetUserId, courseId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!targetUserId && !!courseId,
    queryFn: async () => {
      // Fetch top-level comments (parent_id is null)
      const { data: topLevel, error } = await supabase
        .from('top_ten_comments')
        .select(`
          id, commenter_id, body, created_at, parent_id,
          user_profiles!top_ten_comments_commenter_id_profiles_fkey (display_name, username, profile_photo_url)
        `)
        .eq('target_user_id', targetUserId)
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch all replies for this course+user
      const { data: allReplies } = await supabase
        .from('top_ten_comments')
        .select(`
          id, commenter_id, body, created_at, parent_id,
          user_profiles!top_ten_comments_commenter_id_profiles_fkey (display_name, username, profile_photo_url)
        `)
        .eq('target_user_id', targetUserId)
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true });

      // Attach replies to their parent
      return (topLevel ?? []).map((c: any) => ({
        ...mapComment(c),
        replies: (allReplies ?? [])
          .filter((r: any) => r.parent_id === c.id)
          .map(mapComment),
      })) as TopTenComment[];
    },
    staleTime: 15_000,
  });

  const addComment = useMutation({
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      if (!body.trim()) throw new Error('Empty comment');

      // Insert the comment
      const { data: newComment, error } = await supabase
        .from('top_ten_comments')
        .insert({
          commenter_id: user.id,
          target_user_id: targetUserId,
          course_id: courseId,
          body: body.trim(),
          parent_id: parentId ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;

      // ── Mention extraction ──────────────────────────────────────
      try {
        const mentionMatches = body.match(/@([\w]+(?:\s[\w]+)*)/g) ?? [];
        for (const match of mentionMatches) {
          const username = match.slice(1).trim();
          const { data: mentionedUser } = await supabase
            .from('user_profiles')
            .select('id, username')
            .eq('username', username)
            .single();
          if (!mentionedUser) continue;
          if (mentionedUser.id === user.id) continue;

          // Store mention
          await supabase.from('top_ten_comment_mentions' as any).insert({
            comment_id: newComment.id,
            mentioned_user_id: mentionedUser.id,
            mentioned_username: username,
          });

          // Fire mention notification
          const { data: commenterProfile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          const commenterName = commenterProfile?.display_name ?? 'Someone';

          await supabase.from('notifications').insert({
            user_id: mentionedUser.id,
            recipient_actor_type: 'personal',
            recipient_actor_id: mentionedUser.id,
            actor_id: user.id,
            type: 'top_ten_mention',
            title: `${commenterName} mentioned you in a Top 10 comment`,
            message: body.trim().length > 60 ? body.trim().slice(0, 60) + '…' : body.trim(),
            entity_type: 'top_ten',
            entity_id: courseId,
            is_read: false,
            data: { target_user_id: targetUserId },
          });
        }
      } catch {
        // Mention extraction is non-blocking
      }

      // ── Reply notification ──────────────────────────────────────
      try {
        if (parentId) {
          const { data: parentComment } = await supabase
            .from('top_ten_comments')
            .select('commenter_id')
            .eq('id', parentId)
            .single();

          if (parentComment && parentComment.commenter_id !== user.id) {
            const { data: commenterProfile } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('id', user.id)
              .single();
            const commenterName = commenterProfile?.display_name ?? 'Someone';

            await supabase.from('notifications').insert({
              user_id: parentComment.commenter_id,
              recipient_actor_type: 'personal',
              recipient_actor_id: parentComment.commenter_id,
              actor_id: user.id,
              type: 'top_ten_reply',
              title: `${commenterName} replied to your comment`,
              message: body.trim().length > 60 ? body.trim().slice(0, 60) + '…' : body.trim(),
              entity_type: 'top_ten',
              entity_id: courseId,
              is_read: false,
              data: { target_user_id: targetUserId },
            });
          }
        } else if (user.id !== targetUserId) {
          // Top-level comment notification to top ten owner
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();
          const name = profile?.display_name ?? 'Someone';
          await supabase.from('notifications').insert({
            user_id: targetUserId,
            recipient_actor_type: 'personal',
            recipient_actor_id: targetUserId,
            actor_id: user.id,
            type: 'top_ten_comment',
            title: `${name} commented on your Top 10`,
            message: body.trim().length > 60 ? body.trim().slice(0, 60) + '…' : body.trim(),
            entity_type: 'top_ten',
            entity_id: courseId,
            is_read: false,
            data: { target_user_id: targetUserId },
          });
        }
      } catch {
        // Notification failure is non-blocking
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk });
      queryClient.invalidateQueries({ queryKey: ['top-ten-activity', targetUserId] });
    },
    onError: () => {
      toast.error('Failed to post comment. Please try again.');
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('top_ten_comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .or(`commenter_id.eq.${user.id},target_user_id.eq.${user.id}`);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    isAddingComment: addComment.isPending,
    deleteComment: deleteComment.mutate,
  };
}