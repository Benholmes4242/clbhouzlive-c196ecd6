/**
 * useUpdateParticipantStatus - Hook for accepting/declining join requests
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdateParams {
  participantId: string;
  status: 'going' | 'rejected' | 'declined';
  gameId?: string;
}

export function useUpdateParticipantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participantId, status }: UpdateParams) => {
      const { data, error } = await supabase
        .from('game_participants')
        .update({ 
          rsvp_status: status,
          rsvp_updated_at: new Date().toISOString(),
          state: status === 'going' ? 'accepted' : 'declined',
        })
        .eq('id', participantId)
        .select('game_id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['game-participants', data.game_id] });
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['game-detail', data.game_id] });
      queryClient.invalidateQueries({ queryKey: ['game', data.game_id] });
    },
  });
}

/**
 * useUpdateTripParticipantStatus - Hook for accepting/declining trip join requests
 */
export function useUpdateTripParticipantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participantId, status }: { participantId: string; status: 'confirmed' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('trip_participants')
        .update({ 
          rsvp_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', participantId)
        .select('trip_id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trip-participants', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail', data.trip_id] });
      queryClient.invalidateQueries({ queryKey: ['trip', data.trip_id] });
    },
  });
}
