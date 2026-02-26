import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayedCoordinate {
  lat: number;
  lng: number;
}

/**
 * Lightweight hook that fetches lat/lng for every course the user has rated.
 * Used by the MiniGlobePreview to render season-colored pins.
 */
export function usePlayedCourseCoordinates(userId: string | undefined) {
  return useQuery<PlayedCoordinate[]>({
    queryKey: ['played-course-coordinates', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('course_ratings')
        .select('golf_courses!course_ratings_course_id_fkey(latitude, longitude)')
        .eq('user_id', userId);

      if (error) throw error;

      return (data ?? [])
        .map((r: any) => r.golf_courses)
        .filter(
          (c: any): c is { latitude: number; longitude: number } =>
            c != null && typeof c.latitude === 'number' && typeof c.longitude === 'number',
        )
        .map((c) => ({ lat: c.latitude, lng: c.longitude }));
    },
    enabled: !!userId,
    staleTime: 5 * 60_000, // 5 minutes
  });
}
