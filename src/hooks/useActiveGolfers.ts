import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { channelManager } from '@/utils/supabaseChannelManager';
import { getMockNearby } from '@/features/nearby/mockNearbyGolfers';
import { calculateDistance, formatDistance } from '@/features/nearby/distance';
import { NEARBY_RADIUS_METERS } from '@/features/nearby/config';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';

export type ActiveGolfer = {
  id: string;
  display_name: string;
  username?: string;
  home_club?: string;
  avatar_url?: string;
  is_online: boolean;
  isMock: boolean;
  distance_km?: number;
  distanceText?: string;
  isOpenToPlay?: boolean;
};

export function useActiveGolfers({ limit = 20, mockCount = 5 }: { limit?: number; mockCount?: number } = {}) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const { currentLocation, requestPermission } = useLocationPermission();

  // Fetch nearby users with location and visibility
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit, currentLocation?.lat, currentLocation?.lng],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let userLat = currentLocation?.lat;
      let userLng = currentLocation?.lng;

      if (!userLat || !userLng) {
        const location = await requestPermission();
        if (!location) return [];
        userLat = location.lat;
        userLng = location.lng;
      }

      const STALE_THRESHOLD_MINUTES = 20;
      const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

      // Fetch from user_nearby_status with new visibility_mode and open_to_play fields
      const { data: nearbyStatuses } = await supabase
        .from('user_nearby_status')
        .select('user_id, lat, lng, visibility_mode, last_location_update, open_to_play_active, open_to_play_expires_at')
        .neq('visibility_mode', 'hidden')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .neq('user_id', user.id)
        .gte('last_location_update', staleThreshold);

      if (!nearbyStatuses?.length) return [];

      const now = new Date();

      const nearbyUsers = nearbyStatuses
        .map(status => {
          const distance_meters = calculateDistance(userLat!, userLng!, status.lat!, status.lng!);
          const isOpenToPlay = 
            status.open_to_play_active && 
            status.open_to_play_expires_at && 
            new Date(status.open_to_play_expires_at) > now;
          
          return {
            user_id: status.user_id,
            distance_meters,
            visibility_mode: status.visibility_mode,
            isOpenToPlay,
          };
        })
        .filter(u => {
          // Distance filter
          if (u.distance_meters > NEARBY_RADIUS_METERS) return false;
          
          // For 'friends' mode, we skip for now (client-side stub)
          // TODO: check mutual friendship via user_follows or user_friends table
          if (u.visibility_mode === 'friends') {
            // Stub: allow for now, will implement proper friends check later
            return true;
          }
          
          return true;
        })
        .sort((a, b) => a.distance_meters - b.distance_meters);

      if (!nearbyUsers.length) return [];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club')
        .in('id', nearbyUsers.map(u => u.user_id))
        .eq('is_public', true);

      return profiles?.map(profile => {
        const userData = nearbyUsers.find(u => u.user_id === profile.id);
        return {
          id: profile.id,
          display_name: profile.display_name || profile.username || 'Anonymous',
          username: profile.username,
          avatar_url: profile.profile_photo_url,
          home_club: profile.home_club,
          distance_km: userData ? userData.distance_meters / 1000 : 0,
          distanceText: userData ? formatDistance(userData.distance_meters) : undefined,
          isOpenToPlay: userData?.isOpenToPlay || false,
        };
      }).slice(0, limit) || [];
    },
    staleTime: 15_000,
  });

  useEffect(() => {
    if (realProfiles.length === 0) return;

    const channelName = 'presence:creators_online';
    const channel = channelManager.createChannel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) onlineIds.add(p.user_id);
          });
        });
        setOnlineUserIds(onlineIds);
      })
      .subscribe();

    return () => channelManager.removeChannel(channelName);
  }, [realProfiles.length]);

  const golfers = useMemo<ActiveGolfer[]>(() => {
    const realWithOnline: ActiveGolfer[] = realProfiles.map(p => ({
      ...p,
      is_online: onlineUserIds.has(p.id),
      isMock: false,
    }));

    const mockProfiles: ActiveGolfer[] = getMockNearby(mockCount).map(m => ({
      ...m,
      is_online: false,
      isMock: true,
      isOpenToPlay: false,
    }));

    const blended: ActiveGolfer[] = [];
    const maxLength = Math.max(realWithOnline.length, mockProfiles.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < realWithOnline.length) blended.push(realWithOnline[i]);
      if (i < mockProfiles.length) blended.push(mockProfiles[i]);
    }

    return blended;
  }, [realProfiles, mockCount, onlineUserIds]);

  const realOnlineCount = useMemo(() => {
    return golfers.filter(g => !g.isMock && g.is_online).length;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
