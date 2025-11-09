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

  // Fetch real user profiles
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index')
        .eq('is_public', true)
        .not('id', 'is', null)
        .limit(limit);
      
      if (error) throw error;
      
      // Map to golfer type and randomize distance until location services are ready
      return (data || []).map(profile => ({
        id: profile.id,
        display_name: profile.display_name || profile.username || 'Golfer',
        username: profile.username,
        avatar_url: profile.profile_photo_url,
        home_club: profile.home_club,
        // Randomize distance temporarily (0.5km to 15km)
        distance_km: Math.random() * 14.5 + 0.5,
        distanceText: formatDistance((Math.random() * 14.5 + 0.5) * 1000),
        isOpenToPlay: Math.random() > 0.5,
        sameHomeClub: false,
        eg_handicap_index: profile.eg_handicap_index,
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
