/**
 * useCreateTrip - Hook for creating trips with real database inserts
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TripDraft } from '../components/create-game-trip-v2/types';

interface CreateTripResult {
  tripId: string;
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: TripDraft): Promise<CreateTripResult> => {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to create a trip');
      }

      // Generate trip name from first course or dates
      const tripName = draft.itinerary.length > 0 
        ? `${draft.itinerary[0].courseName} Trip`
        : `Golf Trip`;

      // Build trip record matching actual schema
      const tripRecord = {
        created_by: user.id,
        name: tripName,
        visibility: draft.visibility,
        start_date: draft.startDate.toISOString().split('T')[0],
        end_date: draft.endDate.toISOString().split('T')[0],
        description: draft.notes || null,
      };

      // Insert trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(tripRecord)
        .select('id')
        .single();

      if (tripError) {
        console.error('Failed to create trip:', tripError);
        throw new Error('Failed to create trip');
      }

      // Insert creator as participant with 'going' status
      const { error: creatorError } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: trip.id,
          user_id: user.id,
          role: 'organizer',
          rsvp_status: 'going',
          rsvp_updated_at: new Date().toISOString(),
        });

      if (creatorError) {
        console.error('Failed to add creator as participant:', creatorError);
      }

      // Create games for each itinerary stop (trips contain games)
      for (const stop of draft.itinerary) {
        const stopDate = new Date(draft.startDate);
        stopDate.setDate(stopDate.getDate() + stop.dayIndex);
        
        const gameExpiresAt = new Date(stopDate.getTime() + 24 * 60 * 60 * 1000);

        const { error: gameError } = await supabase
          .from('games')
          .insert({
            host_user_id: user.id,
            course_id: stop.courseId,
            trip_id: trip.id,
            visibility: draft.visibility,
            start_time: stopDate.toISOString(),
            expires_at: gameExpiresAt.toISOString(),
            status: 'active',
          });

        if (gameError) {
          console.error('Failed to create trip game:', gameError);
        }
      }

      // Invite attendees
      if (draft.attendeeIds.length > 0) {
        const invites = draft.attendeeIds.map(attendeeId => ({
          trip_id: trip.id,
          user_id: attendeeId,
          role: 'member',
          rsvp_status: 'invited' as const,
          invited_by: user.id,
        }));

        const { error: inviteError } = await supabase
          .from('trip_participants')
          .insert(invites);

        if (inviteError) {
          console.error('Failed to invite attendees:', inviteError);
        }
      }

      return { tripId: trip.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
}
