import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isMockNearby } from './config';
import { getMockNearby } from './mockNearbyGolfers';
import { NearbyGolfer } from './types';
import { calculateDistance } from './distance';
import { RealtimeChannel } from '@supabase/supabase-js';

const NEARBY_RADIUS_KM = 50; // 50km radius

async function fetchLiveNearby(userLat?: number, userLng?: number): Promise<NearbyGolfer[]> {
  if (!userLat || !userLng) {
    console.log('[Nearby] No user location available');
    return [];
  }

  try {
    const { data: nearbyUsers, error } = await supabase
      .from('user_nearby_status')
      .select(`
        user_id,
        lat,
        lng,
        updated_at,
        is_hidden,
        user_profiles:user_id (
          id,
          display_name,
          username,
          profile_photo_url,
          eg_handicap_index,
          show_handicap,
          home_club
        )
      `)
      .eq('is_hidden', false)
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 min

    if (error) {
      console.error('[Nearby] Error fetching nearby users:', error);
      return [];
    }

    if (!nearbyUsers || nearbyUsers.length === 0) {
      return [];
    }

    // Filter by distance and map to NearbyGolfer format
    const nearby: NearbyGolfer[] = nearbyUsers
      .map((user: any): NearbyGolfer | null => {
        const profile = user.user_profiles;
        if (!profile) return null;

        const distanceMeters = calculateDistance(userLat, userLng, user.lat, user.lng);
        const distanceKm = distanceMeters / 1000;

        // Filter out users beyond radius
        if (distanceKm > NEARBY_RADIUS_KM) return null;

        return {
          id: profile.id,
          display_name: profile.display_name || profile.username || 'Unknown',
          home_club: profile.home_club || undefined,
          avatar_url: profile.profile_photo_url || undefined,
          is_online: true, // They're in the table and updated recently
          distance_km: distanceKm,
          same_club: false, // TODO: implement same_club logic
          isOpenToPlay: true, // They're broadcasting location
          handicap: profile.show_handicap ? profile.eg_handicap_index : undefined,
        } as NearbyGolfer;
      })
      .filter((u): u is NearbyGolfer => u !== null)
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    return nearby;
  } catch (error) {
    console.error('[Nearby] Error in fetchLiveNearby:', error);
    return [];
  }
}

export function useNearbyGolfers(userLat?: number, userLng?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nearbyGolfers', isMockNearby ? 'mock' : 'live', userLat, userLng],
    queryFn: () => isMockNearby ? Promise.resolve(getMockNearby(5)) : fetchLiveNearby(userLat, userLng),
    staleTime: 15_000,
    enabled: isMockNearby || !!(userLat && userLng),
  });

  // Subscribe to realtime updates for nearby users
  useEffect(() => {
    if (isMockNearby || !userLat || !userLng) return;

    const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel('nearby_presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_nearby_status',
        },
        (payload) => {
          if (DEBUG_REALTIME) {
            console.log('[Nearby] event', new Date().toISOString(), payload.eventType);
          }
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ['nearbyGolfers'] });
        }
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) {
          console.log('[Nearby] status', status, new Date().toISOString());
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isMockNearby, userLat, userLng, queryClient]);

  // Refetch on window focus (safety net)
  useEffect(() => {
    const handleFocus = () => {
      const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';
      if (DEBUG_REALTIME) {
        console.log('[Nearby] Refetch on focus');
      }
      queryClient.invalidateQueries({ queryKey: ['nearbyGolfers'] });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [queryClient]);

  return query;
}
