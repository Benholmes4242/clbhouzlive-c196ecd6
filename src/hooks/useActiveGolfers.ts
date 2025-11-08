import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { calculateDistance, formatDistance } from '@/features/nearby/distance';
import { NEARBY_RADIUS_METERS } from '@/features/nearby/config';
import { useLocationPermission } from '@/features/nearby/hooks/useLocationPermission';
import { MOCK_NEARBY } from '@/mocks/live_clubhouse';

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
  sameHomeClub?: boolean;
  eg_handicap_index?: number | null;
};

export function useActiveGolfers({ limit = 20 }: { limit?: number } = {}) {
  const { currentLocation, requestPermission } = useLocationPermission();

  // Fetch nearby users with location and visibility
  const { data: realProfiles = [], isLoading } = useQuery({
    queryKey: ['activeGolfers', limit, currentLocation?.lat, currentLocation?.lng],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get current user's home club
      const { data: currentUserProfile } = await supabase
        .from('user_profiles')
        .select('home_club')
        .eq('id', user.id)
        .single();

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

      // Build base candidates with distance and flags
      const baseCandidates = nearbyStatuses
        .map(status => {
          const distance_meters = calculateDistance(userLat!, userLng!, status.lat!, status.lng!);
          const isOpenToPlay =
            status.open_to_play_active &&
            status.open_to_play_expires_at &&
            new Date(status.open_to_play_expires_at) > now;

          return {
            user_id: status.user_id as string,
            distance_meters,
            visibility_mode: status.visibility_mode as 'all' | 'friends' | 'hidden',
            isOpenToPlay,
          };
        })
        .filter(row => row.distance_meters <= NEARBY_RADIUS_METERS);

      if (!baseCandidates.length) return [];

      // Enforce friends-only visibility: require mutual follow
      const friendOnlyIds = baseCandidates
        .filter(r => r.visibility_mode === 'friends')
        .map(r => r.user_id);

      let allowedFriendIds = new Set<string>();
      if (friendOnlyIds.length) {
        // viewer -> candidate
        const { data: followsA } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', friendOnlyIds);

        // candidate -> viewer
        const { data: followsB } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', user.id)
          .in('follower_id', friendOnlyIds);

        const aSet = new Set((followsA || []).map(r => r.following_id as string));
        (followsB || []).forEach(r => {
          const id = r.follower_id as string;
          if (aSet.has(id)) allowedFriendIds.add(id);
        });
      }

      const candidates = baseCandidates
        .filter(row => {
          if (row.visibility_mode === 'hidden') return false;
          if (row.visibility_mode === 'friends') {
            return allowedFriendIds.has(row.user_id);
          }
          return true; // 'all'
        })
        .sort((a, b) => a.distance_meters - b.distance_meters);

      if (!candidates.length) return [];

      // Pull profiles for remaining user_ids
      const { data: profiles, error: profilesErr } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index')
        .in('id', candidates.map(c => c.user_id))
        .eq('is_public', true);

      if (profilesErr) {
        console.error('profilesErr', profilesErr);
        return [];
      }

      // Shape final list
      const enriched = (profiles || []).map(p => {
        const match = candidates.find(c => c.user_id === p.id);
        const sameHomeClub = !!(
          p.home_club && 
          currentUserProfile?.home_club && 
          p.home_club.trim().toLowerCase() === currentUserProfile.home_club.trim().toLowerCase()
        );
        
        return {
          id: p.id,
          display_name: p.display_name || p.username || 'Anonymous',
          username: p.username,
          avatar_url: p.profile_photo_url,
          home_club: p.home_club,
          distance_km: match ? match.distance_meters / 1000 : 0,
          distanceText: match ? formatDistance(match.distance_meters) : undefined,
          isOpenToPlay: match?.isOpenToPlay || false,
          sameHomeClub,
          eg_handicap_index: p.eg_handicap_index,
        };
      });

      return enriched.slice(0, limit);
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
      isMock: false,
    }));

    // Add mock golfers
    const mockGolfers: ActiveGolfer[] = MOCK_NEARBY.map(m => ({
      id: m.id,
      display_name: m.display_name,
      username: m.username,
      home_club: m.home_club,
      avatar_url: m.profile_photo_url,
      is_online: false,
      isMock: true,
      distance_km: m.distance_km,
      distanceText: formatDistance((m.distance_km || 0) * 1000),
      isOpenToPlay: false,
      sameHomeClub: false,
      eg_handicap_index: m.eg_handicap_index,
    }));

    return [...realWithOnline, ...mockGolfers];
  }, [realProfiles]);

  const realOnlineCount = useMemo(() => {
    // All golfers are real now - return the total count
    return golfers.length;
  }, [golfers]);

  return { golfers, realOnlineCount, isLoading };
}
