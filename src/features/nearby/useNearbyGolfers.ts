import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NearbyGolfer } from './types';
import { calculateDistance } from './distance';
import { NEARBY_RADIUS_METERS } from './config';

async function fetchLiveNearby(userLat?: number, userLng?: number, viewerId?: string, viewerHomeClubId?: string): Promise<NearbyGolfer[]> {
  console.log('[🔍 NEARBY DEBUG] fetchLiveNearby called', { userLat, userLng, viewerId, viewerHomeClubId });
  
  if (!userLat || !userLng) {
    console.log('[🔍 NEARBY DEBUG] No location provided, returning empty');
    return [];
  }

  try {
    const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    console.log('[🔍 NEARBY DEBUG] Filter: visibility_mode != hidden, last_location_update >= ', twentyMinAgo);

    // STEP 1: Fetch candidate IDs from user_nearby_status (no joins to avoid PGRST200)
    const { data: rows, error: statusErr } = await supabase
      .from('user_nearby_status')
      .select('user_id, lat, lng, visibility_mode, last_location_update, open_to_play_active, open_to_play_expires_at')
      .neq('visibility_mode', 'hidden')
      .gte('last_location_update', twentyMinAgo);

    if (statusErr) {
      console.error('[🔍 NEARBY DEBUG] Status fetch error:', statusErr);
      return [];
    }

    console.log('[🔍 NEARBY DEBUG] Raw DB results:', rows?.length || 0, 'rows');
    if (!rows || rows.length === 0) {
      console.log('[🔍 NEARBY DEBUG] No data returned');
      return [];
    }

    // Exclude self + ensure lat/lng present + distance filter
    const candidates = rows.filter(r => {
      if (!r.user_id || r.user_id === viewerId) return false;
      if (r.lat == null || r.lng == null) return false;
      const meters = calculateDistance(userLat, userLng, r.lat, r.lng);
      return meters <= NEARBY_RADIUS_METERS;
    });

    console.log('[🔍 NEARBY DEBUG] After distance filter:', candidates.length, 'candidates');
    if (candidates.length === 0) return [];

    const ids = [...new Set(candidates.map(r => r.user_id))];

    // STEP 2: Fetch profiles for those IDs (no FK join to avoid schema cache issues)
    const { data: profiles, error: profErr } = await supabase
      .from('user_profiles')
      .select(`
        id,
        display_name,
        username,
        profile_photo_url,
        eg_handicap_index,
        show_handicap,
        home_club_id,
        home_club
      `)
      .in('id', ids);

    if (profErr) {
      console.error('[🔍 NEARBY DEBUG] Profile fetch error:', profErr);
      return [];
    }

    console.log('[🔍 NEARBY DEBUG] Fetched profiles:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('[🔍 NEARBY DEBUG] Sample profile:', {
        id: profiles[0].id,
        name: profiles[0].display_name,
        home_club: profiles[0].home_club,
        home_club_id: profiles[0].home_club_id,
        handicap: profiles[0].eg_handicap_index
      });
    }

    // STEP 2b: Fetch course names for any home_club_id values
    const clubIds = Array.from(new Set((profiles || [])
      .map((p: any) => p.home_club_id)
      .filter(Boolean)));

    let clubMap = new Map<string, { id: string; name: string }>();
    if (clubIds.length > 0) {
      const { data: clubs, error: clubsErr } = await supabase
        .from('golf_courses')
        .select('id, name')
        .in('id', clubIds);

      if (clubsErr) {
        console.warn('[🔍 NEARBY DEBUG] Clubs fetch warning:', clubsErr);
      }
      (clubs || []).forEach((c: any) => clubMap.set(c.id, { id: c.id, name: c.name }));
    }

    // STEP 3: Handle friend visibility (fetch mutual follows if needed)
    let mutualSet = new Set<string>();
    const friendOnlyIds = candidates.filter(c => c.visibility_mode === 'friends').map(c => c.user_id);
    
    if (viewerId && friendOnlyIds.length > 0) {
      // Get users that viewerId follows AND who follow viewerId back
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', viewerId)
        .in('following_id', friendOnlyIds);

      const { data: followers } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', viewerId)
        .in('follower_id', friendOnlyIds);

      const followingSet = new Set((following || []).map(r => r.following_id));
      mutualSet = new Set((followers || []).filter(r => followingSet.has(r.follower_id)).map(r => r.follower_id));
      
      console.log('[🔍 NEARBY DEBUG] Mutual friends:', mutualSet.size);
    }

    // STEP 4: Build final list
    const profileById = new Map((profiles || []).map(p => [p.id, p]));
    const nearby: NearbyGolfer[] = candidates
      .filter(c => c.visibility_mode === 'all' || mutualSet.has(c.user_id))
      .map(c => {
        const prof = profileById.get(c.user_id);
        if (!prof) return null;
        
        // Safety: skip if coords missing
        if (c.lat == null || c.lng == null) return null;

        const distanceMeters = calculateDistance(userLat, userLng, c.lat, c.lng);
        
        // Calculate if open to play based on actual DB data
        const isOpenToPlay = c.open_to_play_active === true && 
          (!c.open_to_play_expires_at || new Date(c.open_to_play_expires_at) > new Date());
        
        // Build consistent home club object from home_club field (text) or separate courses lookup
        let homeClub = prof.home_club_id ? clubMap.get(prof.home_club_id) : undefined;
        
        // Fallback to legacy home_club text field
        if (!homeClub && prof.home_club && typeof prof.home_club === 'string') {
          const clubName = prof.home_club.trim();
          if (clubName) {
            homeClub = { id: 'legacy', name: clubName };
          }
        }
        
        console.log('[🔍 NEARBY DEBUG] Golfer club data:', {
          userId: prof.id,
          name: prof.display_name,
          home_club_id: prof.home_club_id,
          home_club_text: prof.home_club,
          resolved: homeClub,
          handicap: prof.eg_handicap_index
        });
        
        // Check if same home club as viewer
        const sameHomeClub = !!(viewerHomeClubId && prof.home_club_id && prof.home_club_id === viewerHomeClubId);
        
        const golfer: NearbyGolfer = {
          id: prof.id,
          display_name: prof.display_name || prof.username || 'Unknown',
          username: prof.username || undefined,
          home_club: homeClub,
          avatar_url: prof.profile_photo_url || undefined,
          is_online: true,
          distance_km: distanceMeters / 1000,
          handicap: prof.eg_handicap_index ?? undefined, // always show if available
          isOpenToPlay,
          same_club: sameHomeClub,
        };
        return golfer;
      })
      .filter((g): g is NearbyGolfer => g !== null)
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    console.log('[🔍 NEARBY DEBUG] Final nearby golfers:', nearby.length);
    if (nearby.length > 0) {
      console.log('[🔍 NEARBY DEBUG] First golfer:', nearby[0]);
    }
    
    return nearby;
  } catch (error) {
    console.error('[🔍 NEARBY DEBUG] Error:', error);
    return [];
  }
}

export function useNearbyGolfers(userLat?: number, userLng?: number, viewerId?: string, viewerHomeClubId?: string) {
  const queryClient = useQueryClient();
  const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';

  console.log('[🔍 NEARBY DEBUG] useNearbyGolfers hook render', { 
    userLat, 
    userLng, 
    viewerId,
    viewerHomeClubId,
    enabled: !!userLat && !!userLng 
  });

  const query = useQuery({
    queryKey: ['nearbyGolfers', 'live', userLat, userLng, viewerId, viewerHomeClubId],
    queryFn: () => fetchLiveNearby(userLat, userLng, viewerId, viewerHomeClubId),
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
