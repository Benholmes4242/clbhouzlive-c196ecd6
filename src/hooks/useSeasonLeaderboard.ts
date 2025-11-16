import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SeasonLeaderboardRow {
  season_id: string;
  season_slug: string;
  season_name: string;
  user_id: string;
  total_xp: number;
  season_rank: number;
  profile?: {
    username: string;
    display_name: string | null;
    profile_photo_url: string | null;
    home_club: string | null;
  };
}

export function useSeasonLeaderboard(seasonId?: string, limit = 20) {
  return useQuery({
    queryKey: ['season-leaderboard', seasonId, limit],
    enabled: !!seasonId,
    queryFn: async (): Promise<SeasonLeaderboardRow[]> => {
      if (!seasonId) return [];

      const { data, error } = await supabase
        .from('season_leaderboard_view' as any)
        .select(
          `
          season_id,
          season_slug,
          season_name,
          user_id,
          total_xp,
          season_rank,
          user_profiles!inner (
            username,
            display_name,
            profile_photo_url,
            home_club
          )
        `
        )
        .eq('season_id', seasonId)
        .order('season_rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        season_id: row.season_id,
        season_slug: row.season_slug,
        season_name: row.season_name,
        user_id: row.user_id,
        total_xp: row.total_xp,
        season_rank: row.season_rank,
        profile: row.user_profiles ? {
          username: row.user_profiles.username,
          display_name: row.user_profiles.display_name,
          profile_photo_url: row.user_profiles.profile_photo_url,
          home_club: row.user_profiles.home_club,
        } : undefined,
      })) as SeasonLeaderboardRow[];
    },
    staleTime: 30_000,
  });
}
