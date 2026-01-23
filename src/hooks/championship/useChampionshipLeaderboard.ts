import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ChampionshipLeaderboardEntry, 
  ChampionshipLeaderboardResponse,
  ChampionshipArenaMode,
  DivisionSlug,
  ZoneType,
} from '@/types/championship';

export interface UseChampionshipLeaderboardArgs {
  arenaMode: ChampionshipArenaMode;
  divisionFilter?: DivisionSlug | 'all';
  pageSize?: number;
  enabled?: boolean;
}

// RPC return type from get_championship_leaderboard
type LeaderboardRpcRow = {
  courses_logged: number;
  courses_to_next_division: number;
  display_name: string;
  division_id: string;
  division_name: string;
  division_ring_color: string;
  home_club: string;
  is_active_streak: boolean;
  is_friend: boolean;
  is_rival: boolean;
  last_activity_at: string;
  profile_photo_url: string;
  rank: number;
  rank_change_today: number;
  rank_change_week: number;
  streak_days: number;
  user_id: string;
  username: string;
  zone_type: string;
};

function toSlug(divisionId: string): DivisionSlug {
  return divisionId.toLowerCase().replace(/\s+/g, '-') as DivisionSlug;
}

function toZone(zoneType: string): ZoneType {
  if (zoneType === 'promotion') return 'promotion';
  if (zoneType === 'relegation') return 'relegation';
  if (zoneType === 'safe') return 'safe';
  return null;
}

export function useChampionshipLeaderboard(args: UseChampionshipLeaderboardArgs) {
  const { arenaMode, divisionFilter = 'all', pageSize = 50, enabled = true } = args;

  return useInfiniteQuery({
    queryKey: ['championship-leaderboard', arenaMode, divisionFilter],
    initialPageParam: 0,
    enabled,
    queryFn: async ({ pageParam }): Promise<ChampionshipLeaderboardResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      const { data, error } = await supabase.rpc('get_championship_leaderboard', {
        p_scope: arenaMode,
        p_limit: pageSize,
        p_offset: (pageParam as number) * pageSize,
        p_current_user_id: currentUserId || undefined,
      });

      if (error) throw error;

      const rows = (data || []) as LeaderboardRpcRow[];

      // Filter by division if specified (client-side for now)
      const filteredRows = divisionFilter === 'all' 
        ? rows 
        : rows.filter(r => toSlug(r.division_id) === divisionFilter);

      const mapEntry = (row: LeaderboardRpcRow): ChampionshipLeaderboardEntry => ({
        user_id: row.user_id,
        display_name: row.display_name || row.username || 'Anonymous',
        avatar_url: row.profile_photo_url || null,
        home_club: row.home_club || null,
        courses_this_season: row.courses_logged,
        current_rank: row.rank,
        rank_movement: row.rank_change_today, // Use daily by default
        movement_period: 'daily',
        division_slug: toSlug(row.division_id),
        division_name: row.division_name,
        division_color: row.division_ring_color,
        zone: toZone(row.zone_type),
        streak_current: row.streak_days,
        is_current_user: currentUserId === row.user_id,
      });

      // Find current user entry
      const currentUserRow = currentUserId 
        ? rows.find(r => r.user_id === currentUserId)
        : null;

      // Get season info from separate call if needed
      const { data: seasonData } = await supabase.rpc('get_active_season');
      const seasons = seasonData as Array<{
        days_remaining: number;
        end_date: string;
        id: string;
        name: string;
        season_number: number;
        start_date: string;
      }>;
      
      const seasonInfo = seasons && seasons.length > 0 ? {
        id: seasons[0].id,
        name: seasons[0].name,
        season_number: seasons[0].season_number,
        start_date: seasons[0].start_date,
        end_date: seasons[0].end_date,
        status: 'active' as const,
        days_remaining: seasons[0].days_remaining,
      } : null;

      return {
        entries: filteredRows.map(mapEntry),
        total_count: rows.length, // Approximate, will refine with proper pagination
        current_user_entry: currentUserRow ? mapEntry(currentUserRow) : null,
        season: seasonInfo,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.entries.length, 0);
      return loadedCount < lastPage.total_count ? allPages.length : undefined;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
