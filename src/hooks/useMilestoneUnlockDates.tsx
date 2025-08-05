import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMilestoneUnlockDates = (userId?: string) => {
  return useQuery({
    queryKey: ['milestoneUnlockDates', userId],
    queryFn: async () => {
      if (!userId) return {};

      // Get all user's played courses ordered by date added
      const { data: userCourses, error } = await supabase
        .from('user_top100_courses')
        .select('created_at, played_date, course_id')
        .eq('user_id', userId)
        .eq('played', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user courses:', error);
        return {};
      }

      if (!userCourses || userCourses.length === 0) {
        return {};
      }

      // Calculate milestone unlock dates
      const milestones = [20, 50, 100, 200, 300];
      const milestoneUnlockDates: Record<number, string> = {};

      milestones.forEach(milestone => {
        if (userCourses.length >= milestone) {
          // Get the date when the user reached this milestone (Nth course)
          const milestoneDate = userCourses[milestone - 1]?.created_at;
          if (milestoneDate) {
            milestoneUnlockDates[milestone] = milestoneDate;
          }
        }
      });

      return milestoneUnlockDates;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};