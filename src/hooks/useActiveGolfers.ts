import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { formatDistance } from '@/features/golfers/format';
import { NEARBY_RADIUS_METERS } from '@/features/nearby/config';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { getMockNearby } from '@/features/nearby/mockNearbyGolfers';

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

  // Return mock data
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit],
    queryFn: async () => {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockGolfers = getMockNearby(limit);
      return mockGolfers.map(golfer => ({
        id: golfer.id,
        display_name: golfer.display_name,
        username: golfer.display_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        avatar_url: golfer.avatar_url,
        home_club: golfer.home_club,
        distance_km: golfer.distance_km,
        distanceText: formatDistance(golfer.distance_km * 1000),
        isOpenToPlay: golfer.isOpenToPlay,
        sameHomeClub: golfer.same_club,
        eg_handicap_index: Math.floor(Math.random() * 25) + 1,
      }));
    },
    staleTime: 15_000,
  });

  // Presence tracking disabled - no longer tracking online status
  // useEffect(() => {
  //   if (realProfiles.length === 0) return;

  //   const channelName = 'presence:creators_online';
  //   const channel = channelManager.createChannel(channelName);

  //   channel
  //     .on('presence', { event: 'sync' }, () => {
  //       const state = channel.presenceState();
  //       const onlineIds = new Set<string>();
  //       Object.values(state).forEach((presences: any) => {
  //         presences.forEach((p: any) => {
  //           if (p.user_id) onlineIds.add(p.user_id);
  //         });
  //       });
  //       setOnlineUserIds(onlineIds);
  //     })
  //     .subscribe();

  //   return () => channelManager.removeChannel(channelName);
  // }, [realProfiles.length]);

  const golfers = useMemo<ActiveGolfer[]>(() => {
    const realWithOnline: ActiveGolfer[] = realProfiles.map(p => ({
      ...p,
      is_online: false, // No longer tracking online status
    }));

    return realWithOnline;
  }, [realProfiles]);

  const realOnlineCount = useMemo(() => {
    // All golfers are real now - return the total count
    return golfers.length;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
