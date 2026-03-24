import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBucketListCourses() {
  return useQuery({
    queryKey: ['bucket-list-courses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('course_shortlists')
        .select(`
          course_id,
          golf_courses!inner (
            id, name, sub_country, country, thumbnail_image,
            course_rating_aggregates(avg_overall_score, review_count)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter out courses the user has already rated (played)
      const { data: playedIds } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', user.id);

      const playedSet = new Set(
        (playedIds ?? []).map(r => r.course_id)
      );

      return (data ?? []).filter(row =>
        !playedSet.has(row.course_id)
      );
    },
    staleTime: 2 * 60 * 1000,
  });
}
