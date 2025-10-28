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

      // Fetch from user_nearby_status with visibility_mode and open_to_play fields
      const { data: nearbyStatuses, error: statusErr } = await supabase
        .from('user_nearby_status')
        .select('user_id, lat, lng, visibility_mode, last_location_update, open_to_play_active, open_to_play_expires_at')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .neq('user_id', user.id)
        .gte('last_location_update', staleThreshold);

      if (statusErr) {
        console.error('nearbyStatuses error', statusErr);
        return [];
      }

      if (!nearbyStatuses?.length) return [];

      const now = new Date();

      const candidates = nearbyStatuses
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
        .filter(row => {
          // Distance limit
          if (row.distance_meters > NEARBY_RADIUS_METERS) return false;
          
          // Visibility rules
          if (row.visibility_mode === 'hidden') return false;
          
          if (row.visibility_mode === 'friends') {
            // TODO: enforce "friends only" when we have friend graph
            // For now allow them so people can test the mode
            return true;
          }
          
          // 'all'
          return true;
        })
        .sort((a, b) => a.distance_meters - b.distance_meters);

      if (!candidates.length) return [];

      // Pull profiles for remaining user_ids
      const { data: profiles, error: profilesErr } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club')
        .in('id', candidates.map(c => c.user_id))
        .eq('is_public', true);

      if (profilesErr) {
        console.error('profilesErr', profilesErr);
        return [];
      }

      // Shape final list
      const enriched = (profiles || []).map(p => {
        const match = candidates.find(c => c.user_id === p.id);
        return {
          id: p.id,
          display_name: p.display_name || p.username || 'Anonymous',
          username: p.username,
          avatar_url: p.profile_photo_url,
          home_club: p.home_club,
          distance_km: match ? match.distance_meters / 1000 : 0,
          distanceText: match ? formatDistance(match.distance_meters) : undefined,
          isOpenToPlay: match?.isOpenToPlay || false,
        };
      });

      return enriched.slice(0, limit);
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

    console.log('🔍 [useActiveGolfers] realProfiles:', realProfiles.length, realProfiles.map(p => p.display_name));
    console.log('🔍 [useActiveGolfers] onlineUserIds:', Array.from(onlineUserIds));
    console.log('🔍 [useActiveGolfers] realWithOnline:', realWithOnline.map(p => ({ name: p.display_name, online: p.is_online })));

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
    const count = golfers.filter(g => !g.isMock && g.is_online).length;
    console.log('🔍 [useActiveGolfers] realOnlineCount:', count);
    return count;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
