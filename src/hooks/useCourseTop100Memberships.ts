import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseTop100Membership {
  list_id: string;
  list_slug: string;
  list_name: string;
  short_label: string;
  rank: number;
}

export function useCourseTop100Memberships(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-top100-memberships', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select(`
          rank,
          list_id,
          top100_lists!inner (
            id,
            slug,
            name,
            short_label
          )
        `)
        .eq('course_id', courseId)
        .order('rank', { ascending: true });

      if (error) throw error;

      return (data || []).map(membership => ({
        list_id: membership.list_id,
        list_slug: (membership.top100_lists as any).slug,
        list_name: (membership.top100_lists as any).name,
        short_label: (membership.top100_lists as any).short_label,
        rank: membership.rank,
      })) as CourseTop100Membership[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
