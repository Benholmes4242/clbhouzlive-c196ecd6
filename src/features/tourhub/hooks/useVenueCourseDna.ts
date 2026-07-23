/**
 * useVenueCourseDna — lazy fetch of course_dna_profiles for a single venue.
 *
 * The join is exact-string on venue_name (matches generate-predictions). Only
 * runs when `enabled` is true — designed to be flipped on when the Insight
 * sheet opens, so the hero paints without waiting on this row.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VenueCourseDna {
  course_type: string | null;
  avg_winning_score: number | null;
  driving_distance_importance: number | null;
  driving_accuracy_importance: number | null;
  gir_importance: number | null;
  scrambling_importance: number | null;
  putting_importance: number | null;
  sg_off_tee_importance: number | null;
  sg_approach_importance: number | null;
  sg_around_green_importance: number | null;
  sg_putting_importance: number | null;
}

export function useVenueCourseDna(venueName: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['venue-course-dna', venueName],
    enabled: enabled && !!venueName,
    staleTime: 60 * 60 * 1000, // 1h — profiles are effectively static
    queryFn: async (): Promise<VenueCourseDna | null> => {
      if (!venueName) return null;
      const { data, error } = await supabase
        .from('course_dna_profiles')
        .select(
          'course_type, avg_winning_score, driving_distance_importance, driving_accuracy_importance, gir_importance, scrambling_importance, putting_importance, sg_off_tee_importance, sg_approach_importance, sg_around_green_importance, sg_putting_importance',
        )
        .eq('venue_name', venueName)
        .maybeSingle();
      if (error) throw error;
      return (data as VenueCourseDna | null) ?? null;
    },
  });
}
