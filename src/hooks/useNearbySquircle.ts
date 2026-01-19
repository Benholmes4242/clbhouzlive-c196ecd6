import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { mockGolfers } from '@/features/golfers/mockGolfers';

type VisibilityMode = 'everyone' | 'friends' | 'hidden';

type NearbySquircleData = {
  count: number;
  visibility: VisibilityMode;
  isOpenToPlay: boolean;
};

async function fetchNearbySquircleData(
  userLat?: number,
  userLng?: number
): Promise<NearbySquircleData> {
  try {
    // Check if mock mode is enabled
    const useMockData = false;
    
    if (useMockData) {
      // Return mock data: 2 golfers (Andrew Yetzes + Gary Martyn)
      return {
        count: mockGolfers.length,
        visibility: 'everyone',
        isOpenToPlay: false,
      };
    }

    // Otherwise fetch real data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { count: 0, visibility: 'everyone', isOpenToPlay: false };
    }

    // Fetch user's visibility and open to play status
    const { data: userStatus } = await supabase
      .from('user_nearby_status')
      .select('visibility_mode, visible_nearby, open_to_play_active, open_to_play_expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const visibility: VisibilityMode = userStatus?.visible_nearby === false ? 'hidden' : 'everyone';
    const isOpenToPlay = userStatus?.open_to_play_active && 
      userStatus?.open_to_play_expires_at && 
      new Date(userStatus.open_to_play_expires_at) > new Date();

    // Fetch count of nearby golfers if we have location
    let count = 0;
    if (userLat && userLng) {
      const { data: nearbyUsers, error } = await supabase
        .from('user_nearby_status')
        .select('user_id, lat, lng')
        .eq('visible_nearby', true)
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .neq('user_id', user.id);

      if (!error && nearbyUsers) {
        // Filter by distance client-side (basic implementation)
        const NEARBY_RADIUS_KM = 5;
        count = nearbyUsers.filter((u) => {
          const dLat = userLat - u.lat;
          const dLng = userLng - u.lng;
          const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // rough approximation
          return distanceKm <= NEARBY_RADIUS_KM;
        }).length;
      }
    }

    return { count, visibility, isOpenToPlay };
  } catch (error) {
    console.error('[NearbySquircle] Error:', error);
    return { count: 0, visibility: 'everyone', isOpenToPlay: false };
  }
}

export function useNearbySquircle() {
  const { currentLocation } = useLocationPermission();

  const query = useQuery({
    queryKey: ['nearby', 'squircle', currentLocation?.lat, currentLocation?.lng],
    queryFn: () => fetchNearbySquircleData(currentLocation?.lat, currentLocation?.lng),
    refetchInterval: 60_000, // 1 min
    staleTime: 15_000,
  });

  return {
    count: query.data?.count ?? 0,
    visibility: query.data?.visibility ?? 'everyone',
    isOpenToPlay: query.data?.isOpenToPlay ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
