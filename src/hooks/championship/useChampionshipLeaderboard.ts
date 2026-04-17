import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
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
  timeFilter?: 'seasonal' | 'all_time';
  clubId?: string | null;
  country?: string | null;
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

// RPC return type from get_championship_leaderboard_alltime
type AllTimeLeaderboardRpcRow = {
  user_id: string;
  username: string;
  display_name: string;
  profile_photo_url: string;
  home_club: string;
  total_courses: number;
  rank: number;
  is_friend: boolean;
  is_rival: boolean;
  current_division: string;
};

function toSlug(divisionId: string | null | undefined): DivisionSlug {
  if (!divisionId) return 'rookie-club' as DivisionSlug; // Default fallback
  // DB stores "rookie", "fairway", etc. - normalize to "rookie-club" format
  const normalized = divisionId.toLowerCase().replace(/\s+/g, '-');
  return (normalized.endsWith('-club') ? normalized : `${normalized}-club`) as DivisionSlug;
}

// Helper to normalize division for comparison (strips -club suffix)
function normalizeDivisionBase(division: string): string {
  return division?.toLowerCase().replace('-club', '').replace(/\s+/g, '-') || '';
}

function toZone(zoneType: string | null | undefined): ZoneType {
  if (zoneType === 'promotion') return 'promotion';
  if (zoneType === 'relegation') return 'relegation';
  if (zoneType === 'safe') return 'safe';
  return null;
}

const DEFAULT_PAGE_SIZE = 50;

export function useChampionshipLeaderboard(args: UseChampionshipLeaderboardArgs) {
  const { arenaMode, divisionFilter = 'all', timeFilter = 'seasonal', clubId = null, country = null, pageSize = DEFAULT_PAGE_SIZE, enabled = true } = args;

  return useInfiniteQuery({
    queryKey: ['championship-leaderboard', arenaMode, divisionFilter, timeFilter, clubId, country],
    initialPageParam: 0,
    enabled,
    placeholderData: keepPreviousData, // Prevent layout shift during filter changes
    queryFn: async ({ pageParam }): Promise<ChampionshipLeaderboardResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;

      // All-Time mode: use the all-time RPC
      if (timeFilter === 'all_time') {
        const { data, error } = await supabase.rpc('get_championship_leaderboard_alltime', {
          p_scope: arenaMode,
          p_limit: pageSize,
          p_offset: pageParam as number,
          p_current_user_id: currentUserId || undefined,
          p_club_id: arenaMode === 'club' ? clubId : undefined,
          p_country: arenaMode === 'country' ? country : undefined,
        });

        if (error) throw error;

        const rows = (data || []) as AllTimeLeaderboardRpcRow[];

        // Apply division filtering for all-time (same logic as seasonal)
        const shouldApplyDivisionFilter = arenaMode === 'division' && divisionFilter !== 'all';
        const filteredRows = shouldApplyDivisionFilter
          ? rows.filter(r => normalizeDivisionBase(r.current_division) === normalizeDivisionBase(divisionFilter))
          : rows;

        const mapAllTimeEntry = (row: AllTimeLeaderboardRpcRow): ChampionshipLeaderboardEntry => ({
          user_id: row.user_id,
          display_name: row.display_name || row.username || 'Anonymous',
          avatar_url: row.profile_photo_url || null,
          home_club: row.home_club || null,
          courses_this_season: row.total_courses, // Re-use field for all-time total
          current_rank: row.rank,
          rank_movement: 0, // No movement tracking for all-time
          movement_period: 'daily',
          division_slug: toSlug(row.current_division), // Use actual division from RPC
          division_name: '',
          division_color: '',
          zone: null,
          streak_current: 0,
          is_current_user: currentUserId === row.user_id,
        });

        return {
          entries: filteredRows.map(mapAllTimeEntry),
          total_count: filteredRows.length,
          current_user_entry: currentUserId 
            ? rows.find(r => r.user_id === currentUserId) 
              ? mapAllTimeEntry(rows.find(r => r.user_id === currentUserId)!)
              : null
            : null,
          season: null,
        };
      }

      // Seasonal mode: use the existing RPC
      const { data, error } = await supabase.rpc('get_championship_leaderboard', {
        p_scope: arenaMode,
        p_limit: pageSize,
        p_offset: pageParam as number,
        p_current_user_id: currentUserId || undefined,
        p_club_id: arenaMode === 'club' ? clubId : undefined,
        p_country: arenaMode === 'country' ? country : undefined,
      });

      if (error) throw error;

      const rows = (data || []) as LeaderboardRpcRow[];

      // Filter by division ONLY when in division arena mode (client-side for now)
      const shouldApplyDivisionFilter = arenaMode === 'division' && divisionFilter !== 'all';
      const filteredRows = shouldApplyDivisionFilter
        ? rows.filter(r => normalizeDivisionBase(r.division_id) === normalizeDivisionBase(divisionFilter))
        : rows;

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

      let seasonInfo: ChampionshipLeaderboardResponse['season'] = null;
      if (seasons && seasons.length > 0) {
        const base = seasons[0];

        // Fetch prize/sponsor columns from championship_seasons (the
        // `get_active_season` RPC doesn't expose them).
        const { data: sponsorRow } = await supabase
          .from('championship_seasons')
          .select('prize_description, sponsor_name, sponsor_url')
          .eq('id', base.id)
          .maybeSingle();

        seasonInfo = {
          id: base.id,
          name: base.name,
          season_number: base.season_number,
          start_date: base.start_date,
          end_date: base.end_date,
          status: 'active' as const,
          days_remaining: base.days_remaining,
          prize_description: sponsorRow?.prize_description ?? null,
          sponsor_name: sponsorRow?.sponsor_name ?? null,
          sponsor_url: sponsorRow?.sponsor_url ?? null,
        };
      }

      return {
        entries: filteredRows.map(mapEntry),
        total_count: rows.length, // Approximate, will refine with proper pagination
        current_user_entry: currentUserRow ? mapEntry(currentUserRow) : null,
        season: seasonInfo,
      };
    },
    getNextPageParam: (lastPage, _allPages) => {
      // Reliable pattern: if last page returned fewer entries than page size, we've reached the end
      if (lastPage.entries.length < pageSize) return undefined;
      // Otherwise, next page offset = total entries loaded so far
      const totalLoaded = _allPages.reduce((sum, p) => sum + p.entries.length, 0);
      return totalLoaded;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
