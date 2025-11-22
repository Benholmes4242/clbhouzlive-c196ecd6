import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NearbyGolfer } from './types';
import { calculateDistance } from './distance';
import { sortGolfers } from './utils/sortGolfers';
import { isMockNearby } from './config';
import { mockGolfers } from '@/features/golfers/mockGolfers';

/**
 * Configuration options for the Nearby Golfers hook
 */
export type NearbyGolfersOptions = {
  radiusKm: number;       // 0.5 | 1 | 3 etc.
  onlyOpen?: boolean;     // filter to Open to Play only
  visibilityMode?: 'all' | 'friends' | 'everyone';
  limit?: number;         // default 999
  userLat?: number;
  userLng?: number;
};

/**
 * Fetches nearby golfers from user_nearby_status table with filters
 */
async function fetchLiveNearby(options: NearbyGolfersOptions): Promise<NearbyGolfer[]> {
  const { userLat, userLng, radiusKm, onlyOpen = false, visibilityMode = 'all', limit = 999 } = options;
  
  // If mock mode is enabled, return ONLY mock data (ignore real database completely)
  if (isMockNearby && Array.isArray(mockGolfers) && mockGolfers.length > 0) {
    console.log('[useNearbyGolfers] Mock mode enabled - returning mock golfers:', mockGolfers);
    const mappedMocks: NearbyGolfer[] = mockGolfers
      .filter((mock: any) => {
        // Apply radius filter
        const distanceKm = mock.distance_m / 1000;
        if (distanceKm > radiusKm) return false;
        
        // Apply onlyOpen filter
        if (onlyOpen && !mock.open_to_play) return false;
        
        return true;
      })
      .map((mock: any) => ({
        id: mock.id || mock.user_id,
        display_name: mock.display_name,
        home_club: mock.home_club,
        avatar_url: mock.profile_photo_url,
        is_online: true,
        distance_km: mock.distance_m / 1000,
        handicap: mock.eg_handicap_index,
        isOpenToPlay: mock.open_to_play,
        sameHomeClub: mock.same_club,
      }))
      .slice(0, limit);
    
    return mappedMocks;
  }
  
  if (!userLat || !userLng) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get current user's home club for comparison
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('home_club')
      .eq('id', user.id)
      .single();
    
    const userHomeClub = currentUserProfile?.home_club;

    const radiusMeters = radiusKm * 1000;
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes

    // Build query
    let query = supabase
      .from('user_nearby_status')
      .select(`
        user_id,
        lat,
        lng,
        updated_at,
        open_to_play_active,
        open_to_play_expires_at,
        visibility_mode,
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
      .neq('user_id', user.id) // Exclude self
      .gte('last_location_update', staleThreshold); // Ignore stale locations

    // Apply visibility filter
    if (visibilityMode === 'friends') {
      // TODO: Add friends-only filter when friends system is ready
      query = query.in('visibility_mode', ['friends', 'all']);
    } else if (visibilityMode === 'everyone') {
      query = query.eq('visibility_mode', 'all');
    } else {
      // 'all' mode: show everyone except hidden
      query = query.neq('visibility_mode', 'hidden');
    }

    const { data, error } = await query;

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
        if (distanceMeters > radiusMeters) return null;

        // Check if open_to_play is active and not expired
        const isOpenToPlay = item.open_to_play_active && 
          item.open_to_play_expires_at && 
          new Date(item.open_to_play_expires_at) > new Date();

        // Apply onlyOpen filter
        if (onlyOpen && !isOpenToPlay) return null;

        return {
          id: profile.id,
          display_name: profile.display_name,
          home_club: profile.home_club,
          avatar_url: profile.profile_photo_url,
          is_online: true,
          distance_km: distanceMeters / 1000,
          handicap: profile.show_handicap ? profile.eg_handicap_index : undefined,
          isOpenToPlay,
          sameHomeClub: userHomeClub && profile.home_club && userHomeClub === profile.home_club,
        };
      })
      .filter((g: NearbyGolfer | null): g is NearbyGolfer => g !== null)
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
      .slice(0, limit); // Apply limit

    return nearby;
  } catch (error) {
    console.error('[NearbyGolfers] Error:', error);
    return [];
  }
}

/**
 * Hook to fetch and subscribe to nearby golfers in real-time
 * This is the single source of truth for both Hub tile and Nearby page
 */
export function useNearbyGolfers(options: NearbyGolfersOptions) {
  const { radiusKm, onlyOpen = false, visibilityMode = 'all', limit = 999, userLat, userLng } = options;
  const queryClient = useQueryClient();
  const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';

  // Create a stable query key that includes all filter options
  const queryKey = ['nearbyGolfers', 'live', radiusKm, onlyOpen, visibilityMode, limit];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchLiveNearby(options),
    select: (golfers) => sortGolfers(golfers),
    staleTime: 15_000,
    enabled: isMockNearby || (!!userLat && !!userLng), // Enable query for mocks even without location
  });

  // Realtime subscription for nearby presence
  useEffect(() => {
    if (!userLat || !userLng) return;
    
    let isMounted = true;

    const channel = supabase
      .channel('nearby_presence_realtime')
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
            console.log('[NearbyGolfers] realtime event', new Date().toISOString(), payload.eventType, userId);
          }
          // Only invalidate if component is still mounted to prevent stale updates after navigation
          if (isMounted) {
            queryClient.invalidateQueries({ queryKey: ['nearbyGolfers', 'live'] });
          }
        }
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) {
          console.log('[NearbyGolfers] subscription status', status);
        }
      });

    return () => {
      isMounted = false;
      if (DEBUG_REALTIME) {
        console.log('[NearbyGolfers] unsubscribing from realtime');
      }
      supabase.removeChannel(channel);
    };
  }, [userLat, userLng, queryClient, DEBUG_REALTIME]);

  return query;
}
