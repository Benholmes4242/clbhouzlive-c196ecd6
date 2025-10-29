import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/features/nearby/distance';
import { NEARBY_RADIUS_METERS } from '@/features/nearby/config';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';

/**
 * Lightweight hook that returns ONLY the count of nearby golfers
 * Does not fetch full profiles or decorate with all metadata
 * Used for quick display (e.g., "5 nearby" badge)
 */
export function useNearbyGolfersCount() {
  const { currentLocation, requestPermission } = useLocationPermission();

  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['nearbyGolfersCount', currentLocation?.lat, currentLocation?.lng],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      let userLat = currentLocation?.lat;
      let userLng = currentLocation?.lng;

      if (!userLat || !userLng) {
        const location = await requestPermission();
        if (!location) return 0;
        userLat = location.lat;
        userLng = location.lng;
      }

      const STALE_THRESHOLD_MINUTES = 20;
      const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

      // Fetch only location data - no profiles
      const { data: nearbyStatuses, error } = await supabase
        .from('user_nearby_status')
        .select('user_id, lat, lng, visibility_mode')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .neq('user_id', user.id)
        .gte('last_location_update', staleThreshold);

      if (error || !nearbyStatuses?.length) return 0;

      // Count users within radius and matching visibility rules
      const count = nearbyStatuses.filter(status => {
        const distance_meters = calculateDistance(userLat!, userLng!, status.lat!, status.lng!);
        
        if (distance_meters > NEARBY_RADIUS_METERS) return false;
        if (status.visibility_mode === 'hidden') return false;
        
        return true;
      }).length;

      return count;
    },
    staleTime: 15_000,
    enabled: !!currentLocation,
  });

  return { count, isLoading };
}
