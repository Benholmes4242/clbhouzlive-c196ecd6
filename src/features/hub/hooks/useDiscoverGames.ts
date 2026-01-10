/**
 * useDiscoverGames - Hook for fetching discoverable games
 * 
 * Fetches games visible to current user based on filters:
 * - visibility (public/friends/club/all)
 * - date range (today/week/month/any)
 * - search by course name
 * 
 * Returns data in UserGame format for GameCard compatibility
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserGame, RsvpStatus, GameStatus } from './useUserGamesTrips';

export type DiscoverVisibility = 'all' | 'public' | 'friends' | 'club';
export type DiscoverWhen = 'today' | 'week' | 'month' | 'any';

export interface DiscoverGamesFilters {
  search?: string;
  visibility?: DiscoverVisibility;
  when?: DiscoverWhen;
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

/**
 * Discover games query
 * - Fetches games that are active/scheduled and not expired
 * - Uses cursor pagination by start_time
 * - Returns UserGame[] compatible with GameCard
 */
export function useDiscoverGames(filters: DiscoverGamesFilters) {
  const filtersKey = buildFiltersKey(filters);

  return useInfiniteQuery({
    queryKey: ['discover-games', filtersKey],
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
          trip_id,
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

      // Map to UserGame shape expected by GameCard
      const mapped: UserGame[] = games.map((g) => {
        const isHost = userId && g.host_user_id === userId;
        const participants = g.game_participants || [];
        const myParticipant = userId 
          ? participants.find((p: any) => p.user_id === userId)
          : null;
        
        // Calculate RSVP counts
        const goingCount = participants.filter((p: any) => p.rsvp_status === 'going').length + (isHost ? 1 : 0);
        const maybeCount = participants.filter((p: any) => p.rsvp_status === 'maybe').length;
        const declinedCount = participants.filter((p: any) => p.rsvp_status === 'declined').length;
        const invitedCount = participants.filter((p: any) => p.rsvp_status === 'invited').length;

        // Determine status
        let status: GameStatus = 'scheduled';
        const now = new Date();
        const startTime = new Date(g.start_time);
        const endsAt = g.ends_at ? new Date(g.ends_at) : null;

        if (g.status === 'completed') {
          status = 'completed';
        } else if (g.status === 'canceled') {
          status = 'canceled';
        } else if (startTime <= now && (!endsAt || endsAt > now)) {
          status = 'live';
        }

        // Current user's RSVP
        let currentUserRsvp: RsvpStatus | null = null;
        if (isHost) {
          currentUserRsvp = 'going';
        } else if (myParticipant) {
          currentUserRsvp = myParticipant.rsvp_status as RsvpStatus;
        }

        return {
          id: g.id,
          courseName: g.course_name ?? 'Unknown Course',
          courseId: g.course_id,
          startsAt: g.start_time,
          endsAt: g.ends_at,
          status,
          tripId: g.trip_id,
          visibility: g.visibility || 'friends',
          currentUserRsvp,
          goingCount,
          maybeCount,
          declinedCount,
          invitedCount,
          hostUserId: g.host_user_id,
          isHost: !!isHost,
          remindersEnabled: false, // Not fetching reminders for discover
        };
      });

      const nextCursor = mapped.length > 0 ? mapped[mapped.length - 1].startsAt : null;

      return { games: mapped, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });
}
