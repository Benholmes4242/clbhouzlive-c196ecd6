/**
 * useCreateTrip - Hook for creating trips with real database inserts
 * 
 * V2: Uses RPC for participant invites, hardened error handling, 
 * fails if game creation fails (no empty timelines)
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
        console.error('[useCreateTrip] Auth error:', authError);
        throw new Error('You must be logged in to create a trip');
      }

      // Generate trip name from first course or dates
      const tripName = draft.itinerary.length > 0 
        ? `${draft.itinerary[0].courseName} Trip`
        : `Golf Trip`;

      // Build trip record matching actual schema
      const tripRecord = {
        created_by: user.id,  // CRITICAL: must match RLS policy (auth.uid() = created_by)
        name: tripName,
        visibility: draft.visibility,
        start_date: draft.startDate.toISOString().split('T')[0],
        end_date: draft.endDate.toISOString().split('T')[0],
        description: draft.notes || null,
      };

      console.log('[useCreateTrip] Creating trip with record:', tripRecord);

      // Insert trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(tripRecord)
        .select('id')
        .single();

      if (tripError) {
        console.error('[useCreateTrip] Failed to create trip:', {
          code: tripError.code,
          message: tripError.message,
          details: tripError.details,
          hint: tripError.hint,
          payload: tripRecord,
        });
        throw new Error(`Failed to create trip: ${tripError.message}`);
      }

      console.log('[useCreateTrip] Trip created:', trip.id);

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
        console.error('[useCreateTrip] Failed to add creator as participant:', {
          code: creatorError.code,
          message: creatorError.message,
          details: creatorError.details,
          hint: creatorError.hint,
        });
        // Non-fatal: continue, trip exists
      }

      // Create games for each itinerary stop (trips contain games)
      // CRITICAL: If any game fails, we throw to avoid trips with empty timelines
      const gameErrors: { courseId: string; error: any }[] = [];
      const createdGameIds: string[] = [];
      
      for (const stop of draft.itinerary) {
        const stopDate = new Date(draft.startDate);
        stopDate.setDate(stopDate.getDate() + stop.dayIndex);
        
        // Set time to noon to avoid timezone issues
        stopDate.setHours(12, 0, 0, 0);
        
        const gameExpiresAt = new Date(stopDate.getTime() + 24 * 60 * 60 * 1000);

        const gamePayload = {
          host_user_id: user.id,
          course_id: stop.courseId,
          trip_id: trip.id,
          visibility: draft.visibility,
          start_time: stopDate.toISOString(),
          expires_at: gameExpiresAt.toISOString(),
          status: 'scheduled',  // Use 'scheduled' for trip games
        };

        console.log('[useCreateTrip] Creating game for stop:', stop.courseName, gamePayload);

        const { data: game, error: gameError } = await supabase
          .from('games')
          .insert(gamePayload)
          .select('id')
          .single();

        if (gameError) {
          console.error('[useCreateTrip] Failed to create trip game:', {
            code: gameError.code,
            message: gameError.message,
            details: gameError.details,
            hint: gameError.hint,
            payload: gamePayload,
          });
          gameErrors.push({ courseId: stop.courseId, error: gameError });
        } else if (game) {
          createdGameIds.push(game.id);
          console.log('[useCreateTrip] Game created:', game.id);
        }
      }

      // CRITICAL: Fail if ANY game fails (not just all) to prevent partial trips
      if (gameErrors.length > 0) {
        // Cleanup: soft-cancel the orphaned trip (UPDATE works under RLS, DELETE often doesn't)
        console.error('[useCreateTrip] Game creation failed, soft-cancelling trip:', trip.id);
        const { error: cancelErr } = await supabase
          .from('trips')
          .update({ 
            status: 'cancelled', 
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', trip.id)
          .eq('created_by', user.id);
        
        if (cancelErr) {
          console.error('[useCreateTrip] Soft-cancel cleanup failed', {
            code: cancelErr.code,
            message: cancelErr.message,
            details: cancelErr.details,
            hint: cancelErr.hint,
            tripId: trip.id,
          });
        }
        
        throw new Error(`Failed to create ${gameErrors.length} round(s): ${gameErrors[0]?.error?.message || 'Unknown error'}`);
      }

      // Invite attendees using RPC (bypasses RLS issues for inviting other users)
      if (draft.attendeeIds.length > 0) {
        console.log('[useCreateTrip] Inviting attendees via RPC:', draft.attendeeIds);
        
        const { error: inviteError } = await supabase.rpc('invite_users_to_trip', {
          p_trip_id: trip.id,
          p_user_ids: draft.attendeeIds,
        });

        if (inviteError) {
          console.error('[useCreateTrip] Failed to invite attendees:', {
            code: inviteError.code,
            message: inviteError.message,
            details: inviteError.details,
            hint: inviteError.hint,
          });
          // Non-fatal: trip exists, invites can be sent later
        }
      }

      console.log('[useCreateTrip] Trip creation complete:', trip.id);
      return { tripId: trip.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
}
