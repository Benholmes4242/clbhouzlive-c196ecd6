/**
 * useDiscoverGamesV2 - Uses game_participants.rsvp_status as single source of truth
 * 
 * Key features:
 * - Uses discover_games_anon view for server-side search (course + host home_club)
 * - Excludes games where user has rsvp_status='rejected'
 * - Returns anonymous host blurb (no identity)
 * - Tracks user's request status from game_participants only
 * - Includes both 'active' and 'scheduled' games
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DiscoverVisibility = 'all' | 'public' | 'friends' | 'club';
export type DiscoverWhen = 'today' | 'week' | 'month' | 'any';

export interface DiscoverGamesFilters {
  search?: string;
  visibility?: DiscoverVisibility;
  when?: DiscoverWhen;
  // Custom date range (takes precedence over 'when')
  customStartAt?: string;
  customEndAt?: string;
}

export interface DiscoverGame {
  id: string;
  courseName: string;
  courseId?: string;
  startsAt: string;
  endsAt?: string;
  visibility: 'public' | 'friends' | 'club';
  slotsTotal: number;
  slotsOpen: number;
  goingCount: number;
  // Anonymous host blurb (no identifying info)
  hostBlurb: {
    handicap: number | null;
    homeClub: string | null;
  };
  // User's request status from game_participants.rsvp_status
  userRequestStatus: 'none' | 'requested' | 'going' | 'invited' | 'rejected';
}

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfRangeISO(when: DiscoverWhen): string {
  const d = new Date();
  if (when === 'today') {
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }
  if (when === 'week') {
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  }
  if (when === 'month') {
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }
  // any - 6 months out
  d.setMonth(d.getMonth() + 6);
  return d.toISOString();
}

function buildFiltersKey(filters: DiscoverGamesFilters): string {
  return JSON.stringify({
    search: (filters.search ?? '').trim().toLowerCase(),
    visibility: filters.visibility ?? 'all',
    when: filters.when ?? 'any',
    customStartAt: filters.customStartAt,
    customEndAt: filters.customEndAt,
  });
}

/**
 * Invalidate all discover-games queries regardless of filter combination
 */
export function invalidateDiscoverGames(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return key === 'discover-games' || key === 'discover-games-v2';
    },
  });
}

export function useDiscoverGamesV2(filters: DiscoverGamesFilters) {
  const filtersKey = buildFiltersKey(filters);

  return useInfiniteQuery({
    // Use consistent key prefix for predicate invalidation
    queryKey: ['discover-games', filtersKey],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const nowIso = new Date().toISOString();
      const when = filters.when ?? 'any';
      
      // Use custom date range if provided, otherwise use preset
      const rangeStart = filters.customStartAt || startOfTodayISO();
      const rangeEnd = filters.customEndAt || endOfRangeISO(when);

      // Use discover_games_anon view for server-side search
      const search = (filters.search ?? '').trim();
      
      let q = supabase
        .from('discover_games_anon')
        .select('*')
        .gte('start_time', rangeStart)
        .lte('start_time', rangeEnd)
        .order('start_time', { ascending: true })
        .limit(50);

      // Cursor pagination by start_time
      if (pageParam) {
        q = q.gt('start_time', pageParam);
      }

      // Visibility filter
      const vis = filters.visibility ?? 'all';
      if (vis !== 'all') {
        q = q.eq('visibility', vis);
      }

      // Server-side search using the combined search_text field
      if (search.length >= 2) {
        q = q.ilike('search_text', `%${search}%`);
      }

      const { data: games, error } = await q;
      
      if (error) {
        console.error('[useDiscoverGamesV2] Query error:', error);
        throw error;
      }

      const gamesList = games ?? [];
      const gameIds = gamesList.map(g => g.id);

      // Get user's participant rows for these games (single source of truth)
      let userParticipantRows: any[] = [];
      if (userId && gameIds.length > 0) {
        const { data: rows } = await supabase
          .from('game_participants')
          .select('game_id, user_id, rsvp_status')
          .eq('user_id', userId)
          .in('game_id', gameIds);
        userParticipantRows = rows ?? [];
      }

      // Build set of rejected game IDs to exclude
      const rejectedGameIds = new Set(
        userParticipantRows
          .filter(r => r.rsvp_status === 'rejected')
          .map(r => r.game_id)
      );

      // Get participant counts for going status
      let participantCounts: Record<string, number> = {};
      if (gameIds.length > 0) {
        const { data: counts } = await supabase
          .from('game_participants')
          .select('game_id')
          .in('game_id', gameIds)
          .eq('rsvp_status', 'going');
        
        if (counts) {
          for (const row of counts) {
            participantCounts[row.game_id] = (participantCounts[row.game_id] || 0) + 1;
          }
        }
      }

      // Filter out games where user was rejected
      const filteredGames = gamesList.filter(g => !rejectedGameIds.has(g.id));

      // Map to DiscoverGame shape
      const mapped: DiscoverGame[] = filteredGames.map((g) => {
        const isHost = userId && g.host_user_id === userId;
        
        // Calculate going count: count all participants with rsvp_status='going' + 1 for host
        const goingParticipants = participantCounts[g.id] || 0;
        const goingCount = goingParticipants + 1; // +1 for host (consistent rule)
        
        // Calculate slots open: slots_total - goingCount
        const slotsOpen = Math.max(0, (g.slots_total || 4) - goingCount);

        // Get user's request status from game_participants (single source of truth)
        let userRequestStatus: 'none' | 'requested' | 'going' | 'invited' | 'rejected' = 'none';
        if (isHost) {
          userRequestStatus = 'going';
        } else {
          const userRow = userParticipantRows.find(r => r.game_id === g.id);
          if (userRow) {
            userRequestStatus = userRow.rsvp_status || 'none';
          }
        }

        // Cast visibility to the correct type
        const visibility = (['public', 'friends', 'club'].includes(g.visibility) 
          ? g.visibility 
          : 'friends') as 'public' | 'friends' | 'club';

        return {
          id: g.id,
          courseName: g.course_name ?? 'Unknown Course',
          courseId: g.course_id,
          startsAt: g.start_time,
          endsAt: g.ends_at,
          visibility,
          slotsTotal: g.slots_total || 4,
          slotsOpen,
          goingCount,
          hostBlurb: {
            handicap: g.host_handicap ?? null,
            homeClub: g.host_home_club ?? null,
          },
          userRequestStatus,
        };
      });

      const nextCursor = mapped.length > 0 ? mapped[mapped.length - 1].startsAt : null;

      return { games: mapped, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });
}
