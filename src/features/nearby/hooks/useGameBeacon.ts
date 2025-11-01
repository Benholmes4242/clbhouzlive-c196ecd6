import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocationPermission } from './useLocationPermission';
import { calculateDistance, formatDistance } from '../distance';
import { NEARBY_RADIUS_METERS } from '../config';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  start_time?: string;
  slots_total?: number;
  tagged_user_ids?: string[];
  guest_participants?: Array<{ guest_name: string }>;
  lat?: number;
  lng?: number;
}

export function useGameBeacon() {
  const [myBeacon, setMyBeacon] = useState<GameBeacon | null>(null);
  const [nearbyBeacons, setNearbyBeacons] = useState<GameBeacon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentLocation, requestPermission } = useLocationPermission();

  const currentUserId = supabase.auth.getUser().then(u => u.data.user?.id);

  // Fetch and filter beacons - now includes user's own games in the unified list
  const fetchBeacons = async () => {
    try {
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
      const radiusMeters = NEARBY_RADIUS_METERS;
      const radiusKm = radiusMeters / 1000;
      const LAT_DEGREE_KM = 111;
      
      let query = supabase
        .from('games')
        .select('id, host_user_id, course_id, course_name, lat, lng, start_time, expires_at, status, slots_total, slots_open, visibility, note, created_at, updated_at')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

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

      const { data: allBeacons, error: allError } = await query
        .order('start_time', { ascending: true }) as { data: any[] | null, error: any };

      if (allError) {
        console.error('Error fetching beacons:', allError);
        return;
      }

      if (!allBeacons) {
        setMyBeacon(null);
        setNearbyBeacons([]);
        return;
      }

      // Fetch games where user is a participant
      const { data: participantGames } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', userId)
        .in('state', ['invited', 'accepted']);

      const participantGameIds = new Set(participantGames?.map(p => p.game_id) || []);

      // Filter beacons: include if user is host OR participant
      const beacons = allBeacons.filter(b => 
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

      // Now fetch ALL nearby public games to include in the list
      if (userLat && userLng) {
        const { data: nearbyPublicGames } = await supabase
          .from('games')
          .select('id, host_user_id, course_id, course_name, lat, lng, start_time, expires_at, status, slots_total, slots_open, visibility, note, created_at, updated_at')
          .eq('status', 'active')
          .eq('visibility', 'public')
          .gt('expires_at', new Date().toISOString())
          .order('start_time', { ascending: true }) as { data: any[] | null, error: any };

        // Combine user's games with nearby public games (deduplicate by ID)
        const gameMap = new Map();
        
        // Add user's games first (marked as isMyGame)
        beacons.forEach(beacon => {
          const isHost = beacon.host_user_id === userId;
          const isParticipant = participantGameIds.has(beacon.id);
          gameMap.set(beacon.id, {
            ...beacon,
            isHost,
            isMyGame: isHost || isParticipant,
            distance_meters: 0,
            distanceText: undefined,
          });
        });

        // Add nearby public games (if not already in map)
        (nearbyPublicGames || []).forEach(beacon => {
          if (!gameMap.has(beacon.id) && beacon.lat && beacon.lng) {
            const distanceMeters = calculateDistance(userLat, userLng, beacon.lat, beacon.lng);
            if (distanceMeters <= NEARBY_RADIUS_METERS) {
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
          // User's games first, then by distance
          if (a.isMyGame && !b.isMyGame) return -1;
          if (!a.isMyGame && b.isMyGame) return 1;
          return (a.distance_meters || 0) - (b.distance_meters || 0);
        });

        setNearbyBeacons(allGames as any);
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
  }, [currentLocation]);

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
      // Check if user already has an active beacon
      if (myBeacon) {
        toast({
          title: 'You already have an active game',
          description: 'Cancel your current game before creating a new one',
          variant: 'destructive',
        });
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to create a game',
          variant: 'destructive',
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
          toast({
            title: 'Location required',
            description: 'Please enable location to create a game',
            variant: 'destructive',
          });
          return;
        }
      }

      // Use edge function to create game properly
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        toast({
          title: 'Authentication error',
          description: 'Please sign in again',
          variant: 'destructive',
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

      // Optimistically update local state
      setMyBeacon({
        ...newBeacon,
        isHost: true,
      });

      toast({
        title: 'Game posted',
        description: 'Nearby golfers can now see your game',
      });

      // Dispatch event to trigger Your Games refetch
      window.dispatchEvent(new CustomEvent('game-created', { 
        detail: { gameId: newBeacon.id } 
      }));
    } catch (error) {
      console.error('Error in createBeacon:', error);
      toast({
        title: 'Error',
        description: 'Failed to create game',
        variant: 'destructive',
      });
    }
  };

  const cancelBeacon = async (beaconId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to cancel a game',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('games')
        .update({ 
          status: 'canceled',
        })
        .eq('id', beaconId)
        .eq('host_user_id', user.user.id);

      if (error) {
        console.error('Error cancelling beacon:', error);
        toast({
          title: 'Failed to cancel game',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Optimistically update local state so UI updates instantly
      setMyBeacon(null);
      setNearbyBeacons(prev => prev.filter(b => b.id !== beaconId));

      toast({
        title: 'Game cancelled',
        description: 'Your game is no longer visible',
      });

      // Refetch to ensure we're synced
      await fetchBeacons();
    } catch (error) {
      console.error('Error in cancelBeacon:', error);
    }
  };

  const joinBeacon = async (beaconId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // For v1, we'll open a message flow instead of directly updating participants
      // This is because RLS only allows hosts to update their own beacons
      toast({
        title: 'Join game',
        description: 'Message the host to join this game (coming soon)',
      });

      // TODO: Implement RPC function or message flow
      console.log('Join beacon:', beaconId, 'by user:', user.user.id);
    } catch (error) {
      console.error('Error in joinBeacon:', error);
    }
  };

  return {
    myBeacon,
    nearbyBeacons,
    isLoading,
    createBeacon,
    cancelBeacon,
    joinBeacon,
  };
}
