import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ListProgress {
  listId: string;
  played: number;
  total: number;
}

export function useUserTop100Progress(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-top100-progress', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Get all courses in each list
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists' as any)
        .select('id, slug')
        .eq('is_active', true);

      if (listsError) throw listsError;

      // Get user's played courses from user_course_activity
      const { data: userActivity, error: activityError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);

      if (activityError) throw activityError;

      const playedCourseIds = new Set(
        (userActivity || []).map((a: any) => a.course_id)
      );

      // For each list, count total courses and played courses
      const progress: ListProgress[] = [];

      for (const list of (lists as any) || []) {
        const { data: memberships, error: membershipError } = await supabase
          .from('course_top100_memberships')
          .select('course_id')
          .eq('list_id', (list as any).id);

        if (membershipError) throw membershipError;

        const total = memberships?.length || 0;
        const played = memberships?.filter((m) =>
          playedCourseIds.has(m.course_id)
        ).length || 0;

        progress.push({
          listId: list.id,
          played,
          total,
        });
      }

      return progress;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
