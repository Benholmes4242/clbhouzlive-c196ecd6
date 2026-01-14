/**
 * useTripRsvp - Hook for managing RSVP status for a trip
 * Similar to useGameRsvp but for trips
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TripRsvpStatus = 'going' | 'maybe' | 'declined' | 'invited';

export interface TripRsvpCounts {
  going: number;
  maybe: number;
  declined: number;
  invited: number;
}

export function useTripRsvp(tripId: string | undefined) {
  const queryClient = useQueryClient();

  const setRsvpMutation = useMutation({
    mutationFn: async (newStatus: TripRsvpStatus) => {
      if (!tripId) throw new Error('No trip ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the participant's RSVP status
      const { error } = await supabase
        .from('trip_participants')
        .update({
          rsvp_status: newStatus,
          rsvp_updated_at: new Date().toISOString(),
        })
        .eq('trip_id', tripId)
        .eq('user_id', user.id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      // Invalidate trip data to refresh
      queryClient.invalidateQueries({ queryKey: ['trip-timeline', tripId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      
      const messages: Record<TripRsvpStatus, string> = {
        going: "You're going! 🌴",
        maybe: "Marked as maybe",
        declined: "You've declined",
        invited: "RSVP cleared",
      };
      toast.success(messages[newStatus]);
    },
    onError: (error) => {
      console.error('Failed to update trip RSVP:', error);
      toast.error('Failed to update RSVP');
    },
  });

  return {
    setRsvp: setRsvpMutation.mutate,
    isUpdating: setRsvpMutation.isPending,
  };
}
