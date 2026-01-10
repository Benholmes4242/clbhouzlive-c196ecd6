/**
 * useDiscoverGamesV2 - Uses game_participants.rsvp_status as single source of truth
 * 
 * Key features:
 * - Excludes games where user has rsvp_status='rejected'
 * - Returns anonymous host blurb (no identity)
 * - Tracks user's request status from game_participants only
 * - Includes both 'active' and 'scheduled' games
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DiscoverVisibility = 'all' | 'public' | 'friends' | 'club';
export type DiscoverWhen = 'today' | 'week' | 'month' | 'any';

export interface DiscoverGamesFilters {
  search?: string;
  visibility?: DiscoverVisibility;
  when?: DiscoverWhen;
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
  });
}

export function useDiscoverGamesV2(filters: DiscoverGamesFilters) {
  const filtersKey = buildFiltersKey(filters);

  return useInfiniteQuery({
    queryKey: ['discover-games-v2', filtersKey],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const nowIso = new Date().toISOString();
      const when = filters.when ?? 'any';
      const rangeStart = startOfTodayISO();
      const rangeEnd = endOfRangeISO(when);

      // Base query - select game fields + all participants for counting
      let q = supabase
        .from('games')
        .select(`
          id,
          host_user_id,
          course_name,
          course_id,
          start_time,
          ends_at,
          expires_at,
          status,
          visibility,
          slots_total,
          game_participants!inner (
            user_id,
            rsvp_status
          )
        `)
        // Include both active and scheduled (per spec)
        .or('status.eq.active,status.eq.scheduled')
        .gte('expires_at', nowIso)
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

      // Search: course_name ILIKE
      const search = (filters.search ?? '').trim();
      if (search.length >= 2) {
        q = q.ilike('course_name', `%${search}%`);
      }

      const { data, error } = await q;
      
      // Also fetch games without participants
      let qNoParticipants = supabase
        .from('games')
        .select(`
          id,
          host_user_id,
          course_name,
          course_id,
          start_time,
          ends_at,
          expires_at,
          status,
          visibility,
          slots_total
        `)
        .or('status.eq.active,status.eq.scheduled')
        .gte('expires_at', nowIso)
        .gte('start_time', rangeStart)
        .lte('start_time', rangeEnd)
        .order('start_time', { ascending: true })
        .limit(50);
        
      if (pageParam) {
        qNoParticipants = qNoParticipants.gt('start_time', pageParam);
      }
      if (vis !== 'all') {
        qNoParticipants = qNoParticipants.eq('visibility', vis);
      }
      if (search.length >= 2) {
        qNoParticipants = qNoParticipants.ilike('course_name', `%${search}%`);
      }
      
      const { data: allGamesData } = await qNoParticipants;

      // Merge games from both queries (some may have no participants yet)
      const gamesWithParticipants = (data ?? []) as any[];
      const allGames = (allGamesData ?? []) as any[];
      
      // Create map of games with participant data
      const gameParticipantMap = new Map<string, any[]>();
      for (const g of gamesWithParticipants) {
        const participants = Array.isArray(g.game_participants) ? g.game_participants : [g.game_participants].filter(Boolean);
        gameParticipantMap.set(g.id, participants);
      }

      // Use allGames as base, enrich with participant data
      const games = allGames.map(g => ({
        ...g,
        game_participants: gameParticipantMap.get(g.id) || []
      }));
      
      const gameIds = games.map(g => g.id);
      const hostIds = games.map(g => g.host_user_id).filter(Boolean);

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

      // Get host blurbs (anonymous - no names)
      let hostBlurbs: any[] = [];
      if (hostIds.length > 0) {
        const { data: blurbs } = await supabase
          .from('public_golfer_blurbs')
          .select('user_id, handicap, home_club')
          .in('user_id', hostIds);
        hostBlurbs = blurbs ?? [];
      }

      // Filter out games where user was rejected
      const filteredGames = games.filter(g => !rejectedGameIds.has(g.id));

      // Map to DiscoverGame shape
      const mapped: DiscoverGame[] = filteredGames.map((g) => {
        const isHost = userId && g.host_user_id === userId;
        const participants = g.game_participants || [];
        
        // Calculate going count: count all participants with rsvp_status='going'
        // Host is implicitly going (add 1 always for consistent counting)
        const goingParticipants = participants.filter((p: any) => p.rsvp_status === 'going').length;
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

        // Get host blurb
        const hostBlurb = hostBlurbs.find(b => b.user_id === g.host_user_id);

        return {
          id: g.id,
          courseName: g.course_name ?? 'Unknown Course',
          courseId: g.course_id,
          startsAt: g.start_time,
          endsAt: g.ends_at,
          visibility: g.visibility || 'friends',
          slotsTotal: g.slots_total || 4,
          slotsOpen,
          goingCount,
          hostBlurb: {
            handicap: hostBlurb?.handicap ?? null,
            homeClub: hostBlurb?.home_club ?? null,
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
