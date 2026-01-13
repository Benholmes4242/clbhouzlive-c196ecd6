/**
 * useCancelTrip - Hook for cancelling a trip
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CancelTripParams {
  tripId: string;
  reason?: string;
}

export function useCancelTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId }: CancelTripParams) => {
      // Update trip status to cancelled
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Also cancel all games associated with this trip
      await supabase
        .from('games')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('trip_id', tripId);

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
      toast.success('Trip cancelled', {
        description: 'All participants have been notified',
      });
    },
    onError: (error) => {
      toast.error('Failed to cancel trip', {
        description: error.message,
      });
    },
  });
}
