import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Top100Progress {
  listSlug: string;
  listName: string;
  played: number;
  total: number;
}

export function useUserCourseSummary(userId: string | undefined) {
  const { data: coursesPlayed = 0, isLoading: coursesLoading } = useQuery({
    queryKey: ['user-courses-played-count', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('user_course_activity' as any)
        .select('course_id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return data || 0;
    },
    staleTime: 60_000,
  });

  const { data: countriesPlayed = 0, isLoading: countriesLoading } = useQuery({
    queryKey: ['user-countries-played-count', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 0;

      const { data: activities, error: actError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);

      if (actError) throw actError;

      const courseIds = (activities || []).map((a: any) => a.course_id);
      if (courseIds.length === 0) return 0;

      const { data: courses, error: courseError } = await supabase
        .from('golf_courses')
        .select('country')
        .in('id', courseIds);

      if (courseError) throw courseError;

      const uniqueCountries = new Set((courses || []).map(c => c.country));
      return uniqueCountries.size;
    },
    staleTime: 60_000,
  });

  const { data: top100Progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['user-top100-progress-summary', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Get all active lists
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists' as any)
        .select('id, slug, name')
        .eq('is_active', true);

      if (listsError) throw listsError;

      // Get user's played courses
      const { data: userActivity, error: activityError } = await supabase
        .from('user_course_activity' as any)
        .select('course_id')
        .eq('user_id', userId);

      if (activityError) throw activityError;

      const playedCourseIds = new Set(
        (userActivity || []).map((a: any) => a.course_id)
      );

      // For each list, count total and played
      const progress: Top100Progress[] = [];

      for (const list of (lists as any) || []) {
        const { data: memberships, error: membershipError } = await supabase
          .from('course_top100_memberships')
          .select('course_id')
          .eq('list_id', list.id);

        if (membershipError) throw membershipError;

        const total = memberships?.length || 0;
        const played = memberships?.filter((m) =>
          playedCourseIds.has(m.course_id)
        ).length || 0;

        progress.push({
          listSlug: list.slug,
          listName: list.name,
          played,
          total,
        });
      }

      return progress;
    },
    staleTime: 60_000,
  });

  return {
    totalCoursesPlayed: coursesPlayed,
    countriesPlayed,
    top100Progress,
    isLoading: coursesLoading || countriesLoading || progressLoading,
  };
}
