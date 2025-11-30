import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100CourseMembership = {
  list_slug: string;
  list_name: string;
  short_label: string;
  rank: number | null;
};

export type Top100CourseInsights = {
  course_id: string;
  list_memberships: Top100CourseMembership[];
  user_has_played: boolean;
  user_round_count: number;
  user_last_played_at: string | null;
  unique_players: number;
  total_rounds: number;
  avg_rating: number | null;
  user_rating: number | null;
};

export function useTop100CourseInsights(courseId?: string | null) {
  return useQuery({
    queryKey: ['top100-course-insights', courseId ?? 'none'],
    enabled: !!courseId,
    queryFn: async (): Promise<Top100CourseInsights | null> => {
      if (!courseId) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? null;
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_top100_course_insights', {
        target_course_id: courseId,
        target_user_id: userId,
      });

      if (error) throw error;
      if (!data) return null;

      const payload = data as any;

      return {
        course_id: payload.course_id,
        list_memberships: payload.list_memberships ?? [],
        user_has_played: payload.user_has_played ?? false,
        user_round_count: payload.user_round_count ?? 0,
        user_last_played_at: payload.user_last_played_at ?? null,
        unique_players: payload.unique_players ?? 0,
        total_rounds: payload.total_rounds ?? 0,
        avg_rating: payload.avg_rating ?? null,
        user_rating: payload.user_rating ?? null,
      };
    },
    staleTime: 60_000,
  });
}
