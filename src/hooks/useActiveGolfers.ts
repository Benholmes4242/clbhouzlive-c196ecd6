import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { formatDistance } from '@/features/golfers/format';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { mockGolfers } from '@/features/golfers/mockGolfers';

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

export type GolferFilters = {
  radiusKm?: number;
  onlyOpen?: boolean;
  visibility?: 'all' | 'friends';
};

export function useActiveGolfers({ 
  limit = 999,
  filters = {}
}: { 
  limit?: number;
  filters?: GolferFilters;
} = {}) {
  const { currentLocation } = useLocationPermission();
  const { radiusKm = 10, onlyOpen = false, visibility = 'all' } = filters;
  
  // Check if we're using mock data
  const useMockData = import.meta.env.VITE_USE_MOCK_GOLFERS === 'true';

  // Fetch nearby golfers using PostGIS RPC function
  const { data: golfers = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit, currentLocation, radiusKm, onlyOpen, visibility],
    queryFn: async () => {
      // If using mock data, return it immediately regardless of location
      if (useMockData) {
        const mockMapped = mockGolfers.map(mock => ({
          id: mock.id,
          display_name: mock.display_name,
          username: mock.username,
          avatar_url: mock.profile_photo_url,
          home_club: mock.home_club,
          distance_km: mock.distance_m / 1000,
          distanceText: formatDistance(mock.distance_m),
          isOpenToPlay: mock.open_to_play,
          sameHomeClub: false,
          eg_handicap_index: mock.eg_handicap_index,
          is_online: false,
        })) as ActiveGolfer[];
        
        return mockMapped;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!currentLocation || !user) {
        return [];
      }

      // Call the PostGIS RPC function
      const { data, error } = await supabase.rpc('nearby_golfers', {
        me: user.id,
        my_lat: currentLocation.lat,
        my_lng: currentLocation.lng,
        max_km: radiusKm,
        only_open: onlyOpen,
        visibility_filter: visibility,
        limit_rows: limit,
        offset_rows: 0,
      });

      if (error) {
        console.error('Error fetching nearby golfers:', error);
        return [];
      }

      // Map to our golfer type
      return (data || []).map((profile: any) => ({
        id: profile.user_id,
        display_name: profile.display_name || profile.username || 'Unknown',
        username: profile.username,
        avatar_url: profile.profile_photo_url,
        home_club: profile.home_club,
        distance_km: profile.distance_m / 1000,
        distanceText: formatDistance(profile.distance_m),
        isOpenToPlay: profile.open_to_play,
        sameHomeClub: false, // TODO: Compare with current user's home club
        eg_handicap_index: profile.eg_handicap_index,
        is_online: false,
      })) as ActiveGolfer[];
    },
    enabled: useMockData || !!currentLocation, // Enable query for mocks even without location
    staleTime: 15_000,
  });

  const realOnlineCount = useMemo(() => {
    return golfers.length;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
