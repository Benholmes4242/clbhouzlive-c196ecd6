import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { syncMentionsForContent } from '@/lib/mentions/syncMentions';

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
    mutationFn: async ({ body, parentId }: { body: string; parentId?: string }): Promise<string> => {
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

      const newCommentId = newComment!.id as string;

      // ── Mentions v2: single canonical write path. ─────────────
      // Trigger on the `mentions` table fires notifications for each
      // added row — no client-side notification insert here.
      try {
        await syncMentionsForContent({
          sourceType: 'top_ten_comment',
          sourceId: newCommentId,
          content: body,
          mentionerId: user.id,
        });
      } catch (e) {
        console.warn('[useTopTenComments] mention sync failed:', e);
      }

      // Reply / owner notifications are written by the
      // `trg_top_ten_comments_create_notification` DB trigger
      // (public.create_top_ten_comment_notification). Client-side
      // inserts were removed 2026-07-08 for the same reason as the
      // post-comment path: bare .insert() silently swallowed 23505
      // unique_violation collisions on idx_notifications_dedup.




      return newCommentId;
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
    addComment: (args: { body: string; parentId?: string }): Promise<string> => addComment.mutateAsync(args),
    isAddingComment: addComment.isPending,
    deleteComment: deleteComment.mutate,
  };
}