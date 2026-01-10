/**
 * useTripDetail - Fetch trip details with anonymous view for non-members
 * 
 * Identity reveal rules:
 * - If viewer is organizer (created_by): show all identities
 * - If viewer has rsvp_status going/invited: show all identities
 * - Otherwise: anonymous view (no organizer identity, no participant list)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TripDetailData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  visibility: string;
  coverImageUrl: string | null;
  slotsTotal: number;
  slotsOpen: number;
  participantCount: number;
  organizerId: string;
  // Anonymous blurb (always available)
  organizerBlurb: {
    handicap: number | null;
    homeClub: string | null;
    isVerified: boolean;
    showsHandicap: boolean;
    showsHomeClub: boolean;
  };
  // Identity (only if viewer has access)
  organizer: {
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    handicap: number | null;
  } | null;
  // Participants (only if viewer has access)
  participants: Array<{
    odUserId: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    handicap: number | null;
    showHandicap: boolean;
    rsvpStatus: string;
  }>;
  // User's own status
  userRequestStatus: 'none' | 'requested' | 'going' | 'invited' | 'rejected';
  // Whether identity is revealed
  canSeeIdentity: boolean;
}

export function useTripDetail(tripId: string | null) {
  return useQuery({
    queryKey: ['trip-detail', tripId],
    enabled: !!tripId,
    queryFn: async (): Promise<TripDetailData | null> => {
      if (!tripId) return null;

      const { data: auth } = await supabase.auth.getUser();
      const currentUserId = auth.user?.id ?? null;

      // Fetch trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError || !trip) {
        console.error('[useTripDetail] Trip fetch error:', tripError);
        return null;
      }

      // Fetch organizer profile
      const { data: organizerProfile } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, eg_handicap_index, show_handicap, home_club, home_club_visibility, is_verified_golfer')
        .eq('id', trip.created_by)
        .single();

      // Fetch all participants
      const { data: participants } = await supabase
        .from('trip_participants')
        .select(`
          id,
          user_id,
          rsvp_status,
          user_profiles (
            id,
            display_name,
            username,
            profile_photo_url,
            eg_handicap_index,
            show_handicap
          )
        `)
        .eq('trip_id', tripId);

      const participantsList = participants ?? [];
      
      // Determine user's request status
      type RsvpStatusType = 'none' | 'requested' | 'going' | 'invited' | 'rejected';
      let userRequestStatus: RsvpStatusType = 'none';
      const isOrganizer = currentUserId === trip.created_by;
      
      if (isOrganizer) {
        userRequestStatus = 'going';
      } else if (currentUserId) {
        const userParticipant = participantsList.find(p => p.user_id === currentUserId);
        if (userParticipant) {
          const status = userParticipant.rsvp_status;
          if (status === 'requested' || status === 'going' || status === 'invited' || status === 'rejected') {
            userRequestStatus = status;
          }
        }
      }

      // Determine if viewer can see identities
      const canSeeIdentity = isOrganizer || 
        userRequestStatus === 'going' || 
        userRequestStatus === 'invited';

      // Calculate participant counts
      const goingParticipants = participantsList.filter(p => p.rsvp_status === 'going');
      const goingCount = goingParticipants.length + 1; // +1 for organizer
      const slotsTotal = 20; // Default for trips
      const slotsOpen = Math.max(0, slotsTotal - goingCount);

      // Determine home club visibility
      const showsHomeClub = organizerProfile?.home_club_visibility === 'public' || 
                           organizerProfile?.home_club_visibility === 'everyone';

      return {
        id: trip.id,
        title: trip.name ?? 'Untitled Trip',
        description: trip.description,
        startDate: trip.start_date,
        endDate: trip.end_date,
        visibility: trip.visibility ?? 'public',
        coverImageUrl: trip.cover_image_url,
        slotsTotal,
        slotsOpen,
        participantCount: goingCount,
        organizerId: trip.created_by,
        // Anonymous blurb (always visible)
        organizerBlurb: {
          handicap: organizerProfile?.show_handicap ? organizerProfile.eg_handicap_index : null,
          homeClub: showsHomeClub ? organizerProfile?.home_club : null,
          isVerified: organizerProfile?.is_verified_golfer ?? false,
          showsHandicap: organizerProfile?.show_handicap ?? false,
          showsHomeClub,
        },
        // Identity (only if allowed)
        organizer: canSeeIdentity && organizerProfile ? {
          displayName: organizerProfile.display_name ?? 'Unknown',
          username: organizerProfile.username,
          avatarUrl: organizerProfile.profile_photo_url,
          handicap: organizerProfile.eg_handicap_index,
        } : null,
        // Participants (only if allowed)
        participants: canSeeIdentity ? participantsList
          .filter(p => p.rsvp_status === 'going' || p.rsvp_status === 'invited')
          .map(p => ({
            odUserId: p.user_id ?? '',
            displayName: (p.user_profiles as any)?.display_name ?? 'Unknown',
            username: (p.user_profiles as any)?.username ?? null,
            avatarUrl: (p.user_profiles as any)?.profile_photo_url ?? null,
            handicap: (p.user_profiles as any)?.eg_handicap_index ?? null,
            showHandicap: (p.user_profiles as any)?.show_handicap ?? true,
            rsvpStatus: p.rsvp_status ?? 'going',
          })) : [],
        userRequestStatus,
        canSeeIdentity,
      };
    },
    staleTime: 30_000,
  });
}
