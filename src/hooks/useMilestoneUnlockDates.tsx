import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Ratings-only: milestone dates based on course_ratings
 */
export const useMilestoneUnlockDates = (userId?: string) => {
  return useQuery({
    queryKey: ['milestoneUnlockDates', userId],
    queryFn: async () => {
      if (!userId) return {};

      // Get all user's rated courses ordered by date (ratings-only)
      const { data: userRatings, error } = await supabase
        .from('course_ratings')
        .select('created_at, course_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user ratings:', error);
        return {};
      }

      if (!userRatings || userRatings.length === 0) {
        return {};
      }

      // Calculate milestone unlock dates
      const milestones = [5, 10, 20, 50, 100, 200, 300, 400];
      const milestoneUnlockDates: Record<number, string> = {};

      milestones.forEach(milestone => {
        if (userRatings.length >= milestone) {
          // Get the date when the user reached this milestone (Nth rating)
          const milestoneDate = userRatings[milestone - 1]?.created_at;
          if (milestoneDate) {
            milestoneUnlockDates[milestone] = milestoneDate;
          }
        }
      });

      return milestoneUnlockDates;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};