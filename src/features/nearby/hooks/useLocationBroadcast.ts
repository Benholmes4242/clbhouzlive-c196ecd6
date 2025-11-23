import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocationPermission } from './useLocationPermission';
import { useVisibility } from './useVisibility';
import { MIN_LOCATION_CHANGE_METERS } from '../constants';

const BROADCAST_INTERVAL_MS = 15 * 1000; // 15 seconds - efficient battery usage

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Continuously broadcasts user location when visibility is not "hidden"
 */
export function useLocationBroadcast() {
  const { user } = useSupabaseSession();
  const { getCurrentLocation } = useLocationPermission();
  const { visibilityMode } = useVisibility();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWriteRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Only broadcast if visibility is active (not hidden)
    if (!user?.id || visibilityMode === 'hidden') {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const broadcastLocation = async () => {
      try {
        const now = Date.now();

        // Rate limiting: Check if enough time has passed since last write
        if (lastWriteRef.current && now - lastWriteRef.current < BROADCAST_INTERVAL_MS) {
          return;
        }

        const loc = await getCurrentLocation();
        if (!loc) return;

        // Check if user has moved enough to warrant an update
        if (lastLocationRef.current) {
          const distance = calculateDistance(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            loc.lat,
            loc.lng
          );

          if (distance < MIN_LOCATION_CHANGE_METERS) {
            // Update timestamp to prevent spam even if not moving
            lastWriteRef.current = now;
            return;
          }
        }

        // Proceed with database update
        const { error } = await supabase
          .from('user_nearby_status')
          .upsert(
            {
              user_id: user.id,
              lat: loc.lat,
              lng: loc.lng,
              last_location_update: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (!error) {
          // Update refs only on successful write
          lastWriteRef.current = now;
          lastLocationRef.current = { lat: loc.lat, lng: loc.lng };
        }
      } catch (error) {
        console.error('[LocationBroadcast] Error:', error);
      }
    };

    // Broadcast immediately on mount/visibility change
    broadcastLocation();

    // Then broadcast periodically
    intervalRef.current = setInterval(broadcastLocation, BROADCAST_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, visibilityMode, getCurrentLocation]);

  return null;
}
