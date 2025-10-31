import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NearbyGolfer } from './types';
import { calculateDistance } from './distance';
import { NEARBY_RADIUS_METERS } from './config';

async function fetchLiveNearby(userLat?: number, userLng?: number): Promise<NearbyGolfer[]> {
  console.log('[🔍 NEARBY DEBUG] fetchLiveNearby called', { userLat, userLng });
  
  if (!userLat || !userLng) {
    console.log('[🔍 NEARBY DEBUG] No location provided, returning empty');
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[🔍 NEARBY DEBUG] No authenticated user');
      return [];
    }
    
    console.log('[🔍 NEARBY DEBUG] Fetching with user:', user.id);
    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    console.log('[🔍 NEARBY DEBUG] Filter: visibility_mode != hidden, last_location_update >= ', twentyMinAgo);

    // Fetch nearby users from user_nearby_status within the last 20 minutes
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
      .neq('visibility_mode', 'hidden')
      .gte('last_location_update', new Date(Date.now() - 20 * 60 * 1000).toISOString())
      .neq('user_id', user.id); // Exclude self

    if (error) {
      console.error('[🔍 NEARBY DEBUG] Fetch error:', error);
      return [];
    }

    console.log('[🔍 NEARBY DEBUG] Raw DB results:', data?.length || 0, 'rows');
    if (!data) {
      console.log('[🔍 NEARBY DEBUG] No data returned');
      return [];
    }
    
    console.log('[🔍 NEARBY DEBUG] Sample row:', data[0]);

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

    console.log('[🔍 NEARBY DEBUG] After distance filter (1km):', nearby.length, 'golfers');
    if (nearby.length > 0) {
      console.log('[🔍 NEARBY DEBUG] First golfer:', nearby[0]);
    }
    
    return nearby;
  } catch (error) {
    console.error('[🔍 NEARBY DEBUG] Error:', error);
    return [];
  }
}

export function useNearbyGolfers(userLat?: number, userLng?: number, viewerId?: string) {
  const queryClient = useQueryClient();
  const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';

  console.log('[🔍 NEARBY DEBUG] useNearbyGolfers hook render', { 
    userLat, 
    userLng, 
    viewerId,
    enabled: !!userLat && !!userLng 
  });

  const query = useQuery({
    queryKey: ['nearbyGolfers', 'live', userLat, userLng, viewerId],
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
          queryClient.invalidateQueries({
            predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'nearbyGolfers',
          });
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
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'nearbyGolfers',
      });
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
