import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NearbyGolfer } from './types';
import { calculateDistance } from './distance';
import { NEARBY_RADIUS_METERS } from './config';

async function fetchLiveNearby(userLat?: number, userLng?: number): Promise<NearbyGolfer[]> {
  if (!userLat || !userLng) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch nearby users from user_nearby_status within the last 5 minutes
    const { data, error } = await supabase
      .from('user_nearby_status')
      .select(`
        user_id,
        lat,
        lng,
        updated_at,
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
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .neq('user_id', user.id); // Exclude self

    if (error) {
      console.error('[NearbyGolfers] Fetch error:', error);
      return [];
    }

    if (!data) return [];

    // Filter by distance and map to NearbyGolfer format
    const nearby: NearbyGolfer[] = data
      .map((item: any): NearbyGolfer | null => {
        const profile = item.user_profiles;
        if (!profile) return null;

        const distanceMeters = calculateDistance(userLat, userLng, item.lat, item.lng);
        if (distanceMeters > NEARBY_RADIUS_METERS) return null;

        return {
          id: profile.id,
          display_name: profile.display_name,
          username: profile.username,
          home_club: profile.home_club,
          avatar_url: profile.profile_photo_url,
          is_online: true,
          distance_km: distanceMeters / 1000,
          handicap: profile.show_handicap ? profile.eg_handicap_index : undefined,
          isOpenToPlay: true, // Assume yes if they're broadcasting location
        };
      })
      .filter((g: NearbyGolfer | null): g is NearbyGolfer => g !== null)
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    return nearby;
  } catch (error) {
    console.error('[NearbyGolfers] Error:', error);
    return [];
  }
}

export function useNearbyGolfers(userLat?: number, userLng?: number, viewerId?: string) {
  const queryClient = useQueryClient();
  const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';

  const query = useQuery({
    queryKey: ['nearbyGolfers', 'live'],
    queryFn: () => fetchLiveNearby(userLat, userLng),
    staleTime: 15_000,
    enabled: !!userLat && !!userLng,
  });

  // Phase 3: Realtime subscription for nearby presence
  useEffect(() => {
    if (!userLat || !userLng) return;

    const channel = supabase
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
            const userId = payload.new && typeof payload.new === 'object' && 'user_id' in payload.new ? payload.new.user_id : 'unknown';
            console.log('[NearbyGolfers] event', new Date().toISOString(), payload.eventType, userId);
          }
          // Refetch when any user's location updates
          queryClient.invalidateQueries({ queryKey: ['nearbyGolfers', 'live'] });
        }
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) {
          console.log('[NearbyGolfers] status', status, new Date().toISOString());
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userLat, userLng, queryClient, DEBUG_REALTIME]);

  // Refetch on window focus (safety net)
  useEffect(() => {
    const handleFocus = () => {
      if (DEBUG_REALTIME) {
        console.log('[NearbyGolfers] Refetch on focus');
      }
      queryClient.invalidateQueries({ queryKey: ['nearbyGolfers', 'live'] });
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
  }, [queryClient, DEBUG_REALTIME]);

  return query;
}
