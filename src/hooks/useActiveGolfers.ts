import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { formatDistance } from '@/features/golfers/format';
import { NEARBY_RADIUS_METERS } from '@/features/nearby/config';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export type ActiveGolfer = {
  id: string;
  display_name: string;
  username?: string;
  home_club?: string;
  avatar_url?: string;
  is_online: boolean;
  distance_km?: number;
  distanceText?: string;
  isOpenToPlay?: boolean;
  sameHomeClub?: boolean;
  eg_handicap_index?: number | null;
};

export function useActiveGolfers({ limit = 999 }: { limit?: number } = {}) {
  const { currentLocation, requestPermission } = useLocationPermission();

  // Fetch nearby golfers from Supabase
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit, currentLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error fetching golfers:', error);
        return [];
      }

      // Map to our golfer type with real data
      return (data || []).map((profile: any) => {
        // Calculate distance if we have location
        let distance_km: number | undefined;
        let distanceText: string | undefined;
        
        if (currentLocation && profile.latitude && profile.longitude) {
          const distance_m = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            profile.latitude,
            profile.longitude
          );
          distance_km = distance_m / 1000;
          distanceText = formatDistance(distance_m);
        }

        return {
          id: profile.id,
          display_name: profile.display_name || profile.username || 'Unknown',
          username: profile.username,
          avatar_url: profile.avatar_url,
          home_club: profile.home_club,
          distance_km,
          distanceText,
          isOpenToPlay: profile.is_open_to_play || false,
          sameHomeClub: false, // TODO: Compare with current user's home club
          eg_handicap_index: profile.eg_handicap_index,
        };
      });
    },
    enabled: true,
    staleTime: 15_000,
  });

  const golfers = useMemo<ActiveGolfer[]>(() => {
    return realProfiles.map(p => ({
      ...p,
      is_online: false, // Online status not tracked
    }));
  }, [realProfiles]);

  const realOnlineCount = useMemo(() => {
    return golfers.length;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
