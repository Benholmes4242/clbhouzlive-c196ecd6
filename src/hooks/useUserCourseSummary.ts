import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserTop100Progress } from './useUserTop100Progress';

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
        .select('id, country')
        .in('id', courseIds);

      if (courseError) throw courseError;

      const uniqueCountries = new Set((courses || []).map(c => c.country));
      return uniqueCountries.size;
    },
    staleTime: 60_000,
  });

  // Reuse the optimized Top 100 progress hook
  const { data: top100Progress = [], isLoading: progressLoading } = useUserTop100Progress(userId);

  return {
    totalCoursesPlayed: coursesPlayed,
    countriesPlayed,
    top100Progress,
    isLoading: coursesLoading || countriesLoading || progressLoading,
  };
}
