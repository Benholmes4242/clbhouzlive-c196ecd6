/**
 * useDiscoverTrips - Hook for fetching discoverable trips
 * 
 * Fetches trips visible to current user based on filters:
 * - visibility (public/friends/all)
 * - date range (today/week/month/any)
 * - search by trip name or destination
 * 
 * Excludes trips where user has been rejected
 * Hides host identity until accepted
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

      // Get participant counts and user's participation status
      const tripIds = trips.map(t => t.id);
      
      let participantData: any[] = [];
      let userParticipantData: any[] = [];
      let hostBlurbs: any[] = [];

      if (tripIds.length > 0) {
        // Get participant counts
        const { data: participants } = await supabase
          .from('trip_participants')
          .select('trip_id, user_id, rsvp_status')
          .in('trip_id', tripIds);
        participantData = participants ?? [];

        // Get user's participation status if logged in
        if (userId) {
          userParticipantData = participantData.filter(p => p.user_id === userId);
        }

        // Get host blurbs (anonymous - no names)
        const hostIds = trips.map(t => t.created_by).filter(Boolean);
        if (hostIds.length > 0) {
          const { data: blurbs } = await supabase
            .from('public_golfer_blurbs')
            .select('user_id, handicap, home_club')
            .in('user_id', hostIds);
          hostBlurbs = blurbs ?? [];
        }
      }

      // Filter out trips where user has been rejected
      const rejectedTripIds = new Set(
        userParticipantData
          .filter(p => p.rsvp_status === 'rejected')
          .map(p => p.trip_id)
      );

      const filteredTrips = trips.filter(t => !rejectedTripIds.has(t.id));

      // Map to DiscoverTrip shape
      const mapped: DiscoverTrip[] = filteredTrips.map((t) => {
        const tripParticipants = participantData.filter(p => p.trip_id === t.id);
        const goingCount = tripParticipants.filter(p => p.rsvp_status === 'going').length + 1; // +1 for creator
        
        const userParticipant = userParticipantData.find(p => p.trip_id === t.id);
        let userRequestStatus: 'none' | 'requested' | 'going' | 'rejected' = 'none';
        if (userId === t.created_by) {
          userRequestStatus = 'going';
        } else if (userParticipant) {
          if (userParticipant.rsvp_status === 'going') userRequestStatus = 'going';
          else if (userParticipant.rsvp_status === 'requested') userRequestStatus = 'requested';
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
          slotsOpen: Math.max(0, (t.capacity ?? 20) - goingCount),
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
