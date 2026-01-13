/**
 * useUpdateTrip - Hook for updating trip details
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TripCourseUpdate {
  id: string;
  courseId: string;
  courseName: string;
  dayNumber: number;
}

interface UpdateTripParams {
  tripId: string;
  updates: {
    name?: string;
    description?: string | null;
    start_date?: string;
    end_date?: string;
    visibility?: string;
  };
  courseUpdates?: TripCourseUpdate[];
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, updates, courseUpdates }: UpdateTripParams) => {
      // Update trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .select()
        .single();

      if (tripError) {
        throw new Error(tripError.message);
      }

      // If course updates provided, update the games for this trip
      if (courseUpdates && courseUpdates.length > 0) {
        // For each course update that's not a temp ID, update the game
        for (const courseUpdate of courseUpdates) {
          if (!courseUpdate.id.startsWith('temp-')) {
            await supabase
              .from('games')
              .update({
                course_id: courseUpdate.courseId,
                course_name: courseUpdate.courseName,
              })
              .eq('id', courseUpdate.id);
          }
        }
      }

      return tripData;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-timeline', variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ['your-games-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
}
