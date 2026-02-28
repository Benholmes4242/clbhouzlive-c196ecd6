import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocationPermission } from './useLocationPermission';
import { calculateDistance, formatDistance } from '../distance';
import { NEARBY_RADIUS_METERS } from '../config';
import { RealtimeChannel } from '@supabase/supabase-js';
import { EVT_GAME_CREATED } from '../constants';
import { emitHub } from '@/lib/hubEvents';

export interface DiscoveryFilters {
  dateFrom?: Date;
  dateTo?: Date;
  radiusMeters?: number;
  sortBy?: 'soonest' | 'closest' | 'open_seats' | 'newest';
  courseId?: string;
}

export interface GameBeacon {
  id: string;
  host_user_id: string;
  course_name: string | null;
  course_id: string | null;
  lat: number | null;
  lng: number | null;
  start_time: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'canceled' | 'completed' | 'expired' | 'at_capacity';
  slots_total: number;
  slots_open: number;
  visibility: 'public' | 'friends' | 'club';
  note: string | null;
  distance_meters?: number;
  distanceText?: string;
  isHost?: boolean;
  participants?: Array<{
    user_id: string;
    role: 'host' | 'player';
    state: 'invited' | 'accepted' | 'declined' | 'removed';
    reserves_slot: boolean;
  }>;
}

interface CreateBeaconInput {
  course_id?: string;
  course_name?: string;
  note?: string;
  visibility?: 'public' | 'friends' | 'club';
  start_time?: string;
  slots_total?: number;
  tagged_user_ids?: string[];
  guest_participants?: Array<{ guest_name: string }>;
  lat?: number;
  lng?: number;
}

const PAGE_SIZE = 20;

export function useGameBeacon(discoveryFilters?: DiscoveryFilters) {
  const [myBeacon, setMyBeacon] = useState<GameBeacon | null>(null);
  const [nearbyBeacons, setNearbyBeacons] = useState<GameBeacon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<{ start_time: string; id: string } | null>(null);
  const { currentLocation, requestPermission } = useLocationPermission();

  const currentUserId = supabase.auth.getUser().then(u => u.data.user?.id);

  // Fetch and filter beacons - now includes user's own games in the unified list
  const fetchBeacons = async (append: boolean = false) => {
    try {
      if (append) {
        setIsLoading(true);
      }
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const userId = user.user.id;

      // Ensure we have location
      let userLat = currentLocation?.lat;
      let userLng = currentLocation?.lng;

      if (!userLat || !userLng) {
        const newLocation = await requestPermission();
        if (newLocation) {
          userLat = newLocation.lat;
          userLng = newLocation.lng;
        }
      }

      // Fetch games where user is host OR participant
      // Build query with optional bounding box for efficiency
      const radiusMeters = discoveryFilters?.radiusMeters || NEARBY_RADIUS_METERS;
      const radiusKm = radiusMeters / 1000;
      const LAT_DEGREE_KM = 111;
      
      let query = supabase
        .from('games')
        .select('id, host_user_id, course_id, course_name, lat, lng, start_time, expires_at, status, slots_total, slots_open, visibility, note, created_at, updated_at')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .gt('slots_open', 0);

      // Apply date filters
      if (discoveryFilters?.dateFrom) {
        query = query.gte('start_time', discoveryFilters.dateFrom.toISOString());
      }
      if (discoveryFilters?.dateTo) {
        query = query.lte('start_time', discoveryFilters.dateTo.toISOString());
      }

      // Apply course filter
      if (discoveryFilters?.courseId) {
        query = query.eq('course_id', discoveryFilters.courseId);
      }

      // Apply bounding box if we have user location
      if (userLat && userLng) {
        const latDelta = radiusKm / LAT_DEGREE_KM;
        const lngDelta = radiusKm / (LAT_DEGREE_KM * Math.cos(userLat * Math.PI / 180));
        
        query = query
          .gte('lat', userLat - latDelta)
          .lte('lat', userLat + latDelta)
          .gte('lng', userLng - lngDelta)
          .lte('lng', userLng + lngDelta);
      }

      // Apply cursor-based pagination
      if (append && cursor) {
        query = query
          .or(`start_time.gt.${cursor.start_time},and(start_time.eq.${cursor.start_time},id.gt.${cursor.id})`);
      }

      // Apply sorting (server-side where possible)
      const sortBy = discoveryFilters?.sortBy || 'soonest';
      switch (sortBy) {
        case 'soonest':
          query = query.order('start_time', { ascending: true }).order('id', { ascending: true });
          break;
        case 'open_seats':
          query = query.order('slots_open', { ascending: false }).order('start_time', { ascending: true });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
          break;
        case 'closest':
        default:
          // For 'closest', we'll sort client-side after distance calculation
          query = query.order('start_time', { ascending: true }).order('id', { ascending: true });
          break;
      }

      const { data: allBeacons, error: allError } = await query
        .limit(PAGE_SIZE + 1) as { data: any[] | null, error: any };

      if (allError) {
        console.error('Error fetching beacons:', allError);
        return;
      }

      if (!allBeacons) {
        setMyBeacon(null);
        setNearbyBeacons([]);
        setHasMore(false);
        return;
      }

      // Check if there are more results (we fetched PAGE_SIZE + 1)
      const hasMoreResults = allBeacons.length > PAGE_SIZE;
      const beaconsPage = hasMoreResults ? allBeacons.slice(0, PAGE_SIZE) : allBeacons;
      
      // Update cursor for next page
      if (hasMoreResults) {
        const lastBeacon = beaconsPage[beaconsPage.length - 1];
        setCursor({ start_time: lastBeacon.start_time, id: lastBeacon.id });
      } else {
        setCursor(null);
      }
      setHasMore(hasMoreResults);

      // Fetch games where user is a participant
      const { data: participantGames } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', userId)
        .in('state', ['invited', 'accepted']);

      const participantGameIds = new Set(participantGames?.map(p => p.game_id) || []);

      // Filter beacons: include if user is host OR participant
      const beacons = beaconsPage.filter(b => 
        b.host_user_id === userId || participantGameIds.has(b.id)
      ) as any[];

      // Separate my beacon from others for backward compatibility
      const myBeaconData = beacons.find(b => b.host_user_id === userId);
      
      // Set my beacon for other components that may need it
      if (myBeaconData) {
        setMyBeacon({
          ...myBeaconData as any,
          isHost: true,
        });
      } else {
        setMyBeacon(null);
      }

      // Now fetch nearby public games to include in the list (paginated)
      if (userLat && userLng) {
        let publicQuery = supabase
          .from('games')
          .select('id, host_user_id, course_id, course_name, lat, lng, start_time, expires_at, status, slots_total, slots_open, visibility, note, created_at, updated_at')
          .eq('status', 'active')
          .eq('visibility', 'public')
          .gt('expires_at', new Date().toISOString())
          .gt('slots_open', 0)
          .neq('host_user_id', userId); // Exclude host's own games

        // Apply same filters to public games
        if (discoveryFilters?.dateFrom) {
          publicQuery = publicQuery.gte('start_time', discoveryFilters.dateFrom.toISOString());
        }
        if (discoveryFilters?.dateTo) {
          publicQuery = publicQuery.lte('start_time', discoveryFilters.dateTo.toISOString());
        }
        if (discoveryFilters?.courseId) {
          publicQuery = publicQuery.eq('course_id', discoveryFilters.courseId);
        }

        // Apply cursor for pagination
        if (append && cursor) {
          publicQuery = publicQuery
            .or(`start_time.gt.${cursor.start_time},and(start_time.eq.${cursor.start_time},id.gt.${cursor.id})`);
        }

        // Apply same sorting
        switch (sortBy) {
          case 'soonest':
            publicQuery = publicQuery.order('start_time', { ascending: true }).order('id', { ascending: true });
            break;
          case 'open_seats':
            publicQuery = publicQuery.order('slots_open', { ascending: false }).order('start_time', { ascending: true });
            break;
          case 'newest':
            publicQuery = publicQuery.order('created_at', { ascending: false }).order('id', { ascending: true });
            break;
          case 'closest':
          default:
            publicQuery = publicQuery.order('start_time', { ascending: true }).order('id', { ascending: true });
            break;
        }

        const { data: nearbyPublicGames } = await publicQuery
          .limit(PAGE_SIZE + 1) as { data: any[] | null, error: any };
        
        // Check pagination for public games too
        const hasMorePublic = (nearbyPublicGames?.length || 0) > PAGE_SIZE;
        const publicPage = hasMorePublic ? (nearbyPublicGames || []).slice(0, PAGE_SIZE) : (nearbyPublicGames || []);
        
        if (hasMorePublic && publicPage.length > 0) {
          const lastPublic = publicPage[publicPage.length - 1];
          setCursor({ start_time: lastPublic.start_time, id: lastPublic.id });
          setHasMore(true);
        }

        // Only show nearby public games (user's games appear in "Your Games" tab)
        const gameMap = new Map();

        // Add nearby public games (excluding host's own and already joined) - with client-side safety filter
        publicPage.forEach(beacon => {
          // Skip if user is host or participant
          if (beacon.host_user_id === userId || participantGameIds.has(beacon.id)) {
            return;
          }
          
          if (beacon.lat && beacon.lng && (beacon.slots_open ?? 0) > 0) {
            const distanceMeters = calculateDistance(userLat, userLng, beacon.lat, beacon.lng);
            if (distanceMeters <= radiusMeters) {
              gameMap.set(beacon.id, {
                ...beacon,
                isHost: false,
                isMyGame: false,
                distance_meters: distanceMeters,
                distanceText: formatDistance(distanceMeters),
              });
            }
          }
        });

        const allGames = Array.from(gameMap.values()).sort((a: any, b: any) => {
          // Apply client-side sorting for 'closest' (since it needs distance)
          if (sortBy === 'closest') {
            return (a.distance_meters || 0) - (b.distance_meters || 0);
          }
          
          // For other sorts, server already sorted, just maintain order
          // But add distance as tertiary for stability
          const timeA = new Date(a.start_time).getTime();
          const timeB = new Date(b.start_time).getTime();
          if (timeA !== timeB) return timeA - timeB;
          
          return (a.distance_meters || 0) - (b.distance_meters || 0);
        });

        if (append) {
          setNearbyBeacons(prev => [...prev, ...allGames as any]);
        } else {
          setNearbyBeacons(allGames as any);
        }
      } else {
        // No location - only show user's own games
        const myGames = beacons.map(beacon => ({
          ...beacon,
          isHost: beacon.host_user_id === userId,
          isMyGame: true,
        })) as any[];
        setNearbyBeacons(myGames);
      }
    } catch (error) {
      console.error('Error in fetchBeacons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to realtime changes
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      await fetchBeacons();

      const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';

      channel = supabase
        .channel('games_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'games',
          },
          (payload) => {
            if (DEBUG_REALTIME) {
              const gameId = payload.new && typeof payload.new === 'object' && 'id' in payload.new ? payload.new.id : 'unknown';
              console.log('[Games] event', new Date().toISOString(), payload.eventType, gameId);
            }
            // Refetch on any change
            fetchBeacons();
          }
        )
        .subscribe((status) => {
          if (DEBUG_REALTIME) {
            console.log('[Games] status', status, new Date().toISOString());
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentLocation, discoveryFilters]);

  // Refetch on window focus (safety net)
  useEffect(() => {
    const handleFocus = () => {
      const DEBUG_REALTIME = process.env.NODE_ENV !== 'production';
      if (DEBUG_REALTIME) {
        console.log('[Games] Refetch on focus');
      }
      fetchBeacons();
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
  }, []);

  const createBeacon = async (input: CreateBeaconInput) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Not authenticated', {
          description: 'Please sign in to create a game',
        });
        return;
      }

      // Get current location
      let userLat = currentLocation?.lat;
      let userLng = currentLocation?.lng;

      if (!userLat || !userLng) {
        const newLocation = await requestPermission();
        if (newLocation) {
          userLat = newLocation.lat;
          userLng = newLocation.lng;
        } else {
          toast.error('Location required', {
            description: 'Please enable location to create a game',
          });
          return;
        }
      }

      // Use edge function to create game properly
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        toast.error('Authentication error', {
          description: 'Please sign in again',
        });
        return;
      }

      const startTime = input.start_time ? new Date(input.start_time) : new Date();

      const response = await fetch(
        `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/game-create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_id: input.course_id,
            course_name: input.course_name,
            start_time: startTime.toISOString(),
            slots_total: input.slots_total || 4,
            tagged_user_ids: input.tagged_user_ids || [],
            guest_participants: input.guest_participants || [],
            note: input.note,
            visibility: input.visibility || 'public',
            lat: input.lat || userLat,
            lng: input.lng || userLng,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create game');
      }

      const { game: newBeacon } = await response.json();

      // Dev logging to verify host_user_id matches
      console.log('[Game Create] newBeacon.host_user_id:', newBeacon.host_user_id);
      console.log('[Game Create] current user.id:', user.user.id);
      console.log('[Game Create] IDs match:', newBeacon.host_user_id === user.user.id);

      // Optimistically update local state
      setMyBeacon({
        ...newBeacon,
        isHost: true,
      });

      // Dispatch event immediately BEFORE toast to ensure listeners react first
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVT_GAME_CREATED, { 
          detail: { gameId: newBeacon.id, hostUserId: newBeacon.host_user_id } 
        }));
      }

      // Emit hub event for instant local UI update
      emitHub('game:created', { gameId: newBeacon.id });

      toast.success('Game posted', {
        description: 'Nearby golfers can now see your game',
      });

      return newBeacon;
    } catch (error) {
      console.error('Error in createBeacon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      toast.error('Failed to create game', {
        description: errorMessage,
      });
    }
  };

  const cancelBeacon = async (beaconId: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error('Not authenticated', {
        description: 'Please sign in to cancel a game',
      });
      return;
    }

    // Optimistic update - remove immediately for instant feedback
    const previousBeacon = myBeacon;
    const previousNearby = [...nearbyBeacons];
    
    setMyBeacon(null);
    setNearbyBeacons(prev => prev.filter(b => b.id !== beaconId));

    try {
      const { error } = await supabase
        .from('games')
        .update({ status: 'canceled' })
        .eq('id', beaconId)
        .eq('host_user_id', user.user.id);

      if (error) throw error;

      // Auto-decline all pending join requests for this game
      const now = new Date().toISOString();
      await supabase
        .from('game_join_requests')
        .update({
          status: 'declined',
          decided_at: now,
          decided_by: user.user.id,
        })
        .eq('game_id', beaconId)
        .eq('status', 'pending');

      // Emit hub event for instant local UI update
      emitHub('game:cancelled', { gameId: beaconId });

      toast.success('Game cancelled', {
        description: 'Your game is no longer visible',
      });

      // Refetch to ensure sync
      await fetchBeacons();
    } catch (error) {
      // Rollback on error
      setMyBeacon(previousBeacon);
      setNearbyBeacons(previousNearby);
      
      console.error('Error cancelling beacon:', error);
      toast.error('Failed to cancel game', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const joinBeacon = async (beaconId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // For v1, we'll open a message flow instead of directly updating participants
      // This is because RLS only allows hosts to update their own beacons
      toast('Join game', {
        description: 'Message the host to join this game (coming soon)',
      });

      // TODO: Implement RPC function or message flow
      console.log('Join beacon:', beaconId, 'by user:', user.user.id);
    } catch (error) {
      console.error('Error in joinBeacon:', error);
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    await fetchBeacons(true);
  };

  return {
    myBeacon,
    nearbyBeacons,
    isLoading,
    hasMore,
    loadMore,
    createBeacon,
    cancelBeacon,
    joinBeacon,
  };
}
