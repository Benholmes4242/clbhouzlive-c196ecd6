import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayedUnratedCourse {
  course_id: string;
  name: string;
  region: string | null;
  thumbnail_image: string | null;
  last_played: string | null;
}

export function usePlayedUnratedCourses(userId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['played-unrated', userId], // shared cache with useRateNudgeCourse
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_played_unrated_courses', {
        p_user_id: userId as string,
      });
      if (error) throw error;
      return (data ?? []) as PlayedUnratedCourse[];
    },
  });
  return { courses: data ?? [], count: (data ?? []).length, loading: isLoading };
}
