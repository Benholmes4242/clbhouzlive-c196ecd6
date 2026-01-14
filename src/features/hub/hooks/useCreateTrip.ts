/**
 * useCreateTrip - Hook for creating trips via edge function
 * 
 * V3: Uses trip-create edge function for atomic creation with notifications
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TripDraft } from '../components/create-game-trip-v2/types';

interface CreateTripResult {
  tripId: string;
  tripName: string;
  gamesCreated: number;
  invitesSent: number;
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: TripDraft): Promise<CreateTripResult> => {
      // Generate trip name from first course or dates
      const tripName = draft.tripName || (
        draft.itinerary.length > 0 
          ? `${draft.itinerary[0].courseName} Trip`
          : 'Golf Trip'
      );

      console.log('[useCreateTrip] Creating trip via edge function:', tripName);

      // Build itinerary payload
      const itinerary = draft.itinerary.map(stop => ({
        course_id: stop.courseId,
        course_name: stop.courseName,
        day_index: stop.dayIndex,
        play_date_time: stop.playDateTime?.toISOString(),
        notes: stop.notes,
      }));

      // Build guests payload
      const guests = draft.guestAttendees.map(name => ({ name }));

      // Call edge function
      const { data, error } = await supabase.functions.invoke('trip-create', {
        body: {
          name: tripName,
          description: draft.notes || null,
          start_date: draft.startDate.toISOString().split('T')[0],
          end_date: draft.endDate.toISOString().split('T')[0],
          visibility: draft.visibility,
          itinerary,
          invited_user_ids: draft.attendeeIds,
          guests,
        }
      });

      if (error) {
        console.error('[useCreateTrip] Edge function error:', error);
        throw new Error(error.message || 'Failed to create trip');
      }

      if (!data?.success) {
        console.error('[useCreateTrip] Trip creation failed:', data);
        throw new Error(data?.error || 'Failed to create trip');
      }

      console.log('[useCreateTrip] Trip created successfully:', data);

      return {
        tripId: data.trip_id,
        tripName: data.trip_name,
        gamesCreated: data.games_created,
        invitesSent: data.invites_sent,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
}
