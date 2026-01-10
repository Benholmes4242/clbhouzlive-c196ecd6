/**
 * useRequestJoinTrip - Join mutation for trips
 * 
 * Mirrors useRequestJoinGame for trips:
 * - Uses predicate-based invalidation for all discover-trips query variants
 * - Supports optional message field for Phase 2
 * 
 * Usage: const { mutate } = useRequestJoinTrip();
 *        mutate({ tripId: 'xxx', message: 'optional note' });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';

interface RequestJoinParams {
  tripId: string;
  message?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  TRIP_NOT_AVAILABLE: "This trip is no longer available.",
  ALREADY_REQUESTED: "You've already requested to join.",
  ALREADY_JOINED: "You're already in this trip.",
  IS_ORGANIZER: "Cannot request to join your own trip.",
  TRIP_FULL: "This trip is already full.",
};

export function useRequestJoinTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, message }: RequestJoinParams) => {
      console.log('[useRequestJoinTrip] Creating join request for trip:', tripId, message ? '(with message)' : '');
      
      const { data, error } = await supabase.functions.invoke('create-trip-join-request', {
        body: { trip_id: tripId, message: message || null },
      });

      if (error) {
        console.error('[useRequestJoinTrip] Error:', error);
        throw new Error(error.message || 'UNKNOWN_ERROR');
      }

      if (!data?.success) {
        const code = data?.error || 'UNKNOWN_ERROR';
        throw new Error(code);
      }

      return data;
    },
    onMutate: () => {
      haptic('medium');
    },
    onSuccess: (_data, { tripId }) => {
      toast.success('Request sent to organizer ✅');
      haptic('light');
      
      // Predicate-based invalidation: catch all discover-trips variants
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'discover-trips',
      });
      
      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['trip-detail', tripId] });
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
    },
    onError: (error: Error) => {
      haptic('heavy');
      const message = ERROR_MESSAGES[error.message] || 'Something went wrong. Please try again.';
      toast.error(message);
    },
  });
}
