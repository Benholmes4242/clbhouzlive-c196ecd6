import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface TopTenComment {
  id: string;
  commenter_id: string;
  body: string;
  created_at: string;
  commenter_name: string;
  commenter_username: string;
  commenter_avatar: string | null;
}

export function useTopTenComments(targetUserId: string, courseId: string) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const qk = ['top-ten-comments', targetUserId, courseId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!targetUserId && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top_ten_comments')
        .select(`
          id, commenter_id, body, created_at,
          user_profiles!commenter_id (display_name, username, profile_photo_url)
        `)
        .eq('target_user_id', targetUserId)
        .eq('course_id', courseId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        commenter_id: c.commenter_id,
        body: c.body,
        created_at: c.created_at,
        commenter_name: c.user_profiles?.display_name ?? 'Golfer',
        commenter_username: c.user_profiles?.username ?? '',
        commenter_avatar: c.user_profiles?.profile_photo_url ?? null,
      })) as TopTenComment[];
    },
    staleTime: 15_000,
  });

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Not authenticated');
      if (!body.trim()) throw new Error('Empty comment');
      const { error } = await supabase.from('top_ten_comments').insert({
        commenter_id: user.id,
        target_user_id: targetUserId,
        course_id: courseId,
        body: body.trim(),
      });
      if (error) throw error;
      // Fire notification — only when commenting on someone else's top ten
      if (user.id !== targetUserId) {
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
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from('top_ten_comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('commenter_id', user!.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  return { comments, isLoading, addComment: addComment.mutate, deleteComment: deleteComment.mutate };
}
