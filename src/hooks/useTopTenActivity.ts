import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTopTenActivity(targetUserId: string) {
  return useQuery({
    queryKey: ['top-ten-activity', targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      const [{ data: reactions }, { data: comments }] = await Promise.all([
        supabase.from('top_ten_reactions')
          .select(`
            id, reactor_id, reaction_type, created_at, course_id,
            golf_courses!top_ten_reactions_course_id_fkey ( name ),
            user_profiles!top_ten_reactions_reactor_id_profiles_fkey ( display_name, profile_photo_url )
          `)
          .eq('target_user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('top_ten_comments')
          .select(`
            id, commenter_id, body, created_at, course_id,
            golf_courses!top_ten_comments_course_id_fkey ( name ),
            user_profiles!top_ten_comments_commenter_id_profiles_fkey ( display_name, profile_photo_url )
          `)
          .eq('target_user_id', targetUserId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      const r = (reactions ?? []).map((x: any) => ({
        id: x.id, type: 'reaction' as const,
        actor_name: x.user_profiles?.display_name ?? 'Golfer',
        actor_avatar: x.user_profiles?.profile_photo_url ?? null,
        actor_id: x.reactor_id, course_name: x.golf_courses?.name ?? '',
        course_id: x.course_id, reaction_type: x.reaction_type,
        body: null, created_at: x.created_at,
      }));
      const c = (comments ?? []).map((x: any) => ({
        id: x.id, type: 'comment' as const,
        actor_name: x.user_profiles?.display_name ?? 'Golfer',
        actor_avatar: x.user_profiles?.profile_photo_url ?? null,
        actor_id: x.commenter_id, course_name: x.golf_courses?.name ?? '',
        course_id: x.course_id, reaction_type: null,
        body: x.body, created_at: x.created_at,
      }));
      return [...r, ...c]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 30);
    },
    staleTime: 30_000,
  });
}
