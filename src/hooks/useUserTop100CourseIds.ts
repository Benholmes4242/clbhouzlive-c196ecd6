import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserTop100CourseIds() {
  return useQuery({
    queryKey: ['user-top100-course-ids'],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_user_top100_course_ids', {
        target_user_id: user.id,
      });

      if (error) throw error;

      return (data ?? []) as string[];
    },
    staleTime: 60_000,
  });
}
