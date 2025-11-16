import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LadderEntry {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  profile: {
    username: string;
    display_name: string;
    profile_photo_url: string | null;
  };
}

export interface WeeklyLadder {
  entries: LadderEntry[];
  userEntry: LadderEntry | null;
  weekStart: string;
  weekEnd: string;
  totalPlayers: number;
}

export function useWeeklyChallengeLadder(seasonId?: string, userId?: string) {
  return useQuery({
    queryKey: ['weekly-challenge-ladder', seasonId, userId],
    queryFn: async (): Promise<WeeklyLadder | null> => {
      if (!seasonId) return null;

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      // Get top 50 entries for current week
      const { data: entries, error } = await supabase
        .from('weekly_challenge_ladder')
        .select(`
          *,
          profile:user_profiles!weekly_challenge_ladder_user_id_fkey(
            username,
            display_name,
            profile_photo_url
          )
        `)
        .eq('season_id', seasonId)
        .eq('week_start', weekStart.toISOString())
        .order('points', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get total player count
      const { count: totalPlayers } = await supabase
        .from('weekly_challenge_ladder')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', seasonId)
        .eq('week_start', weekStart.toISOString());

      // Find user's entry if not in top 50
      let userEntry = entries?.find(e => e.user_id === userId) || null;

      if (userId && !userEntry) {
        const { data: userEntryData } = await supabase
          .from('weekly_challenge_ladder')
          .select(`
            *,
            profile:user_profiles!weekly_challenge_ladder_user_id_fkey(
              username,
              display_name,
              profile_photo_url
            )
          `)
          .eq('season_id', seasonId)
          .eq('user_id', userId)
          .eq('week_start', weekStart.toISOString())
          .maybeSingle();

        userEntry = userEntryData;
      }

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      return {
        entries: entries as LadderEntry[],
        userEntry: userEntry as LadderEntry | null,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalPlayers: totalPlayers || 0,
      };
    },
    enabled: !!seasonId,
    staleTime: 30_000, // 30 seconds
  });
}
