import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserCourseActivity {
  user_id: string;
  course_id: string;
  first_played_at?: string;
  last_played_at?: string;
  rating_value?: number;
  has_review: boolean;
  has_rating: boolean;
  in_top_ten: boolean;
  is_top100: boolean;
}

export function useUserCourseActivity(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-course-activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_course_activity' as any)
        .select('*')
        .eq('user_id', userId)
        .order('last_played_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []) as unknown as UserCourseActivity[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
