/**
 * useDeleteTrip - Hook for cancelling/deleting trips
 * Uses soft delete by setting status to 'cancelled'
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (error) throw error;
      return tripId;
    },
    onSuccess: (tripId) => {
      queryClient.invalidateQueries({ queryKey: ['my-hub-events'] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail', tripId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
    },
  });
}
