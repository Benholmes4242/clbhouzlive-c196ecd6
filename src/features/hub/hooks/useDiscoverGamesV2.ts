/**
 * useDiscoverGamesV2 - Enhanced hook for discovering games with anonymity
 * 
 * Key features:
 * - Excludes games where user has been rejected (declined request)
 * - Returns anonymous host blurb instead of identity
 * - Tracks user's request status per game
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
  // User's request status
  userRequestStatus: 'none' | 'requested' | 'going' | 'rejected';
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

      // Base query - select game fields + participant counts
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
          slots_open,
          game_participants (
            user_id,
            rsvp_status
          )
        `)
        // Discoverable statuses
        .or('status.eq.active,status.eq.scheduled')
        .gte('expires_at', nowIso)
        .gte('start_time', rangeStart)
        .lte('start_time', rangeEnd)
        .order('start_time', { ascending: true })
        .limit(30);

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
      if (error) throw error;

      const games = (data ?? []) as any[];
      const gameIds = games.map(g => g.id);
      const hostIds = games.map(g => g.host_user_id).filter(Boolean);

      // Get user's join request statuses if logged in
      let userJoinRequests: any[] = [];
      if (userId && gameIds.length > 0) {
        const { data: requests } = await supabase
          .from('game_join_requests')
          .select('game_id, status')
          .eq('requester_user_id', userId)
          .in('game_id', gameIds);
        userJoinRequests = requests ?? [];
      }

      // Get host blurbs (anonymous - no names)
      let hostBlurbs: any[] = [];
      if (hostIds.length > 0) {
        const { data: blurbs } = await supabase
          .from('public_golfer_blurbs')
          .select('user_id, handicap, home_club')
          .in('user_id', hostIds);
        hostBlurbs = blurbs ?? [];
      }

      // Build map of declined game IDs
      const declinedGameIds = new Set(
        userJoinRequests
          .filter(r => r.status === 'declined')
          .map(r => r.game_id)
      );

      // Filter out games where user was declined
      const filteredGames = games.filter(g => !declinedGameIds.has(g.id));

      // Map to DiscoverGame shape
      const mapped: DiscoverGame[] = filteredGames.map((g) => {
        const isHost = userId && g.host_user_id === userId;
        const participants = g.game_participants || [];
        
        // Calculate going count (host is always going)
        const goingCount = participants.filter((p: any) => p.rsvp_status === 'going').length + (isHost ? 0 : 1);

        // Get user's request status
        let userRequestStatus: 'none' | 'requested' | 'going' | 'rejected' = 'none';
        if (isHost) {
          userRequestStatus = 'going';
        } else {
          const userParticipant = participants.find((p: any) => p.user_id === userId);
          if (userParticipant) {
            if (userParticipant.rsvp_status === 'going') userRequestStatus = 'going';
          } else {
            const joinRequest = userJoinRequests.find(r => r.game_id === g.id);
            if (joinRequest) {
              if (joinRequest.status === 'pending') userRequestStatus = 'requested';
              else if (joinRequest.status === 'accepted') userRequestStatus = 'going';
            }
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
          slotsOpen: g.slots_open || 0,
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
