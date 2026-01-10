/**
 * useTripActions - Hook for trip actions (edit, remove, leave)
 * 
 * Handles:
 * - Trip cancellation with participant notifications
 * - Trip updates
 * - Leave trip (for non-hosts)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSendGameNotification } from './useGameNotifications';

interface CancelTripParams {
  tripId: string;
  tripName: string;
  participantUserIds: string[]; // Users to notify (excluding the host)
}

interface LeaveTripParams {
  tripId: string;
  userId: string;
}

interface UpdateTripParams {
  tripId: string;
  updates: {
    name?: string;
    description?: string;
    visibility?: string;
  };
  participantUserIds: string[];
  tripName: string;
}

/**
 * Hook for cancelling/removing a trip
 * - Deletes the trip (cascades to participants and games)
 * - Notifies all participants
 */
export function useCancelTrip() {
  const queryClient = useQueryClient();
  const sendNotification = useSendGameNotification();

  return useMutation({
    mutationFn: async ({ tripId, tripName, participantUserIds }: CancelTripParams) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete the trip (cascades to trip_participants and games via FK)
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('created_by', user.id); // Ensure only host can delete

      if (deleteError) {
        console.error('[useCancelTrip] Delete failed:', deleteError);
        throw new Error(`Failed to remove trip: ${deleteError.message}`);
      }

      // Send notifications to participants
      if (participantUserIds.length > 0) {
        try {
          await sendNotification.mutateAsync({
            type: 'trip_cancelled' as any, // Will fall back to default handling
            recipientUserIds: participantUserIds,
            tripId,
            data: {
              trip_name: tripName,
            },
          });
        } catch (e) {
          console.error('[useCancelTrip] Failed to send notifications:', e);
          // Non-fatal: trip is already deleted
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip'] });
    },
  });
}

/**
 * Hook for leaving a trip (non-host)
 * - Removes user from trip_participants
 */
export function useLeaveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, userId }: LeaveTripParams) => {
      const { error } = await supabase
        .from('trip_participants')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', userId);

      if (error) {
        console.error('[useLeaveTrip] Failed:', error);
        throw new Error(`Failed to leave trip: ${error.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip'] });
      queryClient.invalidateQueries({ queryKey: ['trip-participants'] });
    },
  });
}

/**
 * Hook for updating trip details
 * - Updates trip record
 * - Optionally notifies participants of changes
 */
export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, updates }: UpdateTripParams) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .eq('created_by', user.id); // Ensure only host can update

      if (error) {
        console.error('[useUpdateTrip] Failed:', error);
        throw new Error(`Failed to update trip: ${error.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip'] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
}
