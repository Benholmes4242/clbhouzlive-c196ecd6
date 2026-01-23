import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to ensure a user has season stats initialized.
 * Call this when a user logs a course to ensure they appear on the leaderboard.
 */
export function useEnsureSeasonStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('ensure_user_season_stats', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-championship-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['championship-leaderboard'] });
    },
  });
}
