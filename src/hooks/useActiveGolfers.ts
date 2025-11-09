import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { formatDistance } from '@/features/golfers/format';
import { NEARBY_RADIUS_METERS } from '@/features/nearby/config';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';

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

  // Fetch real nearby golfers with open-to-play status
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit],
    queryFn: async () => {
      // Query public_profiles view for golfers with open-to-play status
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error fetching golfers:', error);
        return [];
      }

      // Map to our golfer type
      return (data || []).map((profile: any) => ({
        id: profile.id,
        display_name: profile.display_name || profile.username || 'Unknown',
        username: profile.username,
        avatar_url: profile.avatar_url,
        home_club: profile.home_club,
        distance_km: Math.random() * 5, // Randomized until location service is integrated
        distanceText: formatDistance(Math.random() * 5000),
        isOpenToPlay: false, // Will be true once open_to_play fields are added to public_profiles
        sameHomeClub: false,
        eg_handicap_index: profile.eg_handicap_index,
      }));
    },
    enabled: true,
    staleTime: 15_000,
  });

  const golfers = useMemo<ActiveGolfer[]>(() => {
    const realWithOnline: ActiveGolfer[] = realProfiles.map(p => ({
      ...p,
      is_online: false, // No longer tracking online status
    }));

    return realWithOnline;
  }, [realProfiles]);

  const realOnlineCount = useMemo(() => {
    return golfers.length;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
