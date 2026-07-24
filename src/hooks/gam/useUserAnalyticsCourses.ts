import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserAnalyticsCourse {
  course_id: string;
  course_name: string;
  rounds_count: number;
  last_played: string | null;
}

/**
 * Courses the signed-in user has imported rounds at, sourced from the same
 * WHS tables the Analytics tab reads. Ordered by rounds desc.
 *
 * The RPC uses auth.uid() server-side — no user id needed on the client.
 */
export function useUserAnalyticsCourses(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['gam', 'user-analytics-courses'],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<UserAnalyticsCourse[]> => {
      const { data, error } = await supabase.rpc('gam_user_courses' as never);
      if (error) throw error;
      return (data ?? []) as UserAnalyticsCourse[];
    },
  });
}
