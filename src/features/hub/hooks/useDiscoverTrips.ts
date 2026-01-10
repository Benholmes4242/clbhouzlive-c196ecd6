/**
 * useDiscoverTrips - Uses trip_participants.rsvp_status as single source of truth
 * 
 * Key features:
 * - Excludes trips where user has rsvp_status='rejected'
 * - Returns anonymous host blurb (no identity)
 * - Tracks user's request status from trip_participants only
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DiscoverVisibility = 'all' | 'public' | 'friends' | 'club';
export type DiscoverWhen = 'today' | 'week' | 'month' | 'any';

export interface DiscoverTripsFilters {
  search?: string;
  visibility?: DiscoverVisibility;
  when?: DiscoverWhen;
}

export interface DiscoverTrip {
  id: string;
  name: string;
  destination?: string;
  startDate: string;
  endDate: string;
  visibility: string;
  coverImageUrl?: string;
  slotsOpen: number;
  slotsTotal: number;
  participantCount: number;
  // Anonymous host blurb (no identifying info)
  hostBlurb: {
    handicap: number | null;
    homeClub: string | null;
  };
  // User's request status from trip_participants.rsvp_status
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

function buildFiltersKey(filters: DiscoverTripsFilters): string {
  return JSON.stringify({
    search: (filters.search ?? '').trim().toLowerCase(),
    visibility: filters.visibility ?? 'all',
    when: filters.when ?? 'any',
  });
}

export function useDiscoverTrips(filters: DiscoverTripsFilters) {
  const filtersKey = buildFiltersKey(filters);

  return useInfiniteQuery({
    queryKey: ['discover-trips', filtersKey],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const when = filters.when ?? 'any';
      const rangeStart = startOfTodayISO();
      const rangeEnd = endOfRangeISO(when);

      // Base query - select trip fields
      let q = supabase
        .from('trips')
        .select(`
          id,
          name,
          description,
          start_date,
          end_date,
          visibility,
          cover_image_url,
          created_by,
          capacity,
          status
        `)
        .eq('status', 'active')
        .gte('start_date', rangeStart)
        .lte('start_date', rangeEnd)
        .order('start_date', { ascending: true })
        .limit(30);

      // Cursor pagination
      if (pageParam) {
        q = q.gt('start_date', pageParam);
      }

      // Visibility filter
      const vis = filters.visibility ?? 'all';
      if (vis !== 'all') {
        q = q.eq('visibility', vis);
      }

      // Search: name ILIKE
      const search = (filters.search ?? '').trim();
      if (search.length >= 2) {
        q = q.ilike('name', `%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;

      const trips = (data ?? []) as any[];
      const tripIds = trips.map(t => t.id);
      const hostIds = trips.map(t => t.created_by).filter(Boolean);

      // Get all participant data for these trips (for counting)
      let allParticipantData: any[] = [];
      if (tripIds.length > 0) {
        const { data: participants } = await supabase
          .from('trip_participants')
          .select('trip_id, user_id, rsvp_status')
          .in('trip_id', tripIds);
        allParticipantData = participants ?? [];
      }

      // Get user's participant rows specifically (single source of truth)
      let userParticipantRows: any[] = [];
      if (userId && tripIds.length > 0) {
        userParticipantRows = allParticipantData.filter(p => p.user_id === userId);
      }

      // Build set of rejected trip IDs to exclude
      const rejectedTripIds = new Set(
        userParticipantRows
          .filter(r => r.rsvp_status === 'rejected')
          .map(r => r.trip_id)
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

      // Filter out trips where user was rejected
      const filteredTrips = trips.filter(t => !rejectedTripIds.has(t.id));

      // Map to DiscoverTrip shape
      const mapped: DiscoverTrip[] = filteredTrips.map((t) => {
        const tripParticipants = allParticipantData.filter(p => p.trip_id === t.id);
        
        // Calculate going count: participants with rsvp_status='going' + 1 for creator
        const goingParticipants = tripParticipants.filter(p => p.rsvp_status === 'going').length;
        const goingCount = goingParticipants + 1; // +1 for creator (consistent rule)
        
        // Calculate slots open: capacity - goingCount
        const slotsOpen = Math.max(0, (t.capacity ?? 20) - goingCount);

        // Get user's request status from trip_participants (single source of truth)
        let userRequestStatus: 'none' | 'requested' | 'going' | 'invited' | 'rejected' = 'none';
        if (userId === t.created_by) {
          userRequestStatus = 'going';
        } else {
          const userRow = userParticipantRows.find(r => r.trip_id === t.id);
          if (userRow) {
            userRequestStatus = userRow.rsvp_status || 'none';
          }
        }

        const hostBlurb = hostBlurbs.find(b => b.user_id === t.created_by);

        return {
          id: t.id,
          name: t.name ?? 'Untitled Trip',
          destination: t.description,
          startDate: t.start_date,
          endDate: t.end_date,
          visibility: t.visibility ?? 'public',
          coverImageUrl: t.cover_image_url,
          slotsTotal: t.capacity ?? 20,
          slotsOpen,
          participantCount: goingCount,
          hostBlurb: {
            handicap: hostBlurb?.handicap ?? null,
            homeClub: hostBlurb?.home_club ?? null,
          },
          userRequestStatus,
        };
      });

      const nextCursor = mapped.length > 0 ? mapped[mapped.length - 1].startDate : null;

      return { trips: mapped, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000,
  });
}
