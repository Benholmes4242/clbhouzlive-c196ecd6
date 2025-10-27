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
  game_type: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  participants: string[];
  note: string | null;
  distance_meters?: number;
  distanceText?: string;
  isHost?: boolean;
}

interface CreateBeaconInput {
  game_type: string;
  course_name?: string;
  note?: string;
  durationMinutes?: number;
}

export function useGameBeacon() {
  const [myBeacon, setMyBeacon] = useState<GameBeacon | null>(null);
  const [nearbyBeacons, setNearbyBeacons] = useState<GameBeacon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentLocation, requestPermission } = useLocationPermission();

  const currentUserId = supabase.auth.getUser().then(u => u.data.user?.id);

  // Fetch and filter beacons
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

      // Fetch all active, non-expired beacons
      const { data: beacons, error } = await supabase
        .from('game_beacons')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error fetching beacons:', error);
        return;
      }

      if (!beacons) {
        setMyBeacon(null);
        setNearbyBeacons([]);
        return;
      }

      // Separate my beacon from others
      const myBeaconData = beacons.find(b => b.host_user_id === userId);
      const otherBeacons = beacons.filter(b => b.host_user_id !== userId);

      // Set my beacon
      if (myBeaconData) {
        setMyBeacon({
          ...myBeaconData,
          participants: myBeaconData.participants || [],
          isHost: true,
        });
      } else {
        setMyBeacon(null);
      }

      // Filter and annotate nearby beacons
      if (userLat && userLng) {
        const annotated = otherBeacons
          .map(beacon => {
            if (!beacon.lat || !beacon.lng) return null;

            const distanceMeters = calculateDistance(
              userLat,
              userLng,
              beacon.lat,
              beacon.lng
            );

            if (distanceMeters > NEARBY_RADIUS_METERS) return null;

            return {
              ...beacon,
              participants: beacon.participants || [],
              distance_meters: distanceMeters,
              distanceText: formatDistance(distanceMeters),
              isHost: false,
            };
          })
          .filter((b): b is NonNullable<typeof b> => b !== null && b.distance_meters !== undefined)
          .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));

        setNearbyBeacons(annotated);
      } else {
        setNearbyBeacons([]);
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

      channel = supabase
        .channel('game_beacons_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_beacons',
          },
          () => {
            // Refetch on any change
            fetchBeacons();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentLocation]);

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

      const durationMinutes = input.durationMinutes || 120;
      const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();

      const { data: newBeacon, error } = await supabase
        .from('game_beacons')
        .insert({
          host_user_id: user.user.id,
          game_type: input.game_type,
          course_name: input.course_name || null,
          note: input.note || null,
          lat: userLat,
          lng: userLng,
          expires_at: expiresAt,
          is_active: true,
          participants: [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating beacon:', error);
        toast({
          title: 'Failed to create game',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Optimistically update local state
      setMyBeacon({
        ...newBeacon,
        participants: [],
        isHost: true,
      });

      toast({
        title: 'Game posted',
        description: 'Nearby golfers can now see your game',
      });
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
        .from('game_beacons')
        .update({ is_active: false })
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
