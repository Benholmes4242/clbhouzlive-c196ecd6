import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocationPermission } from './useLocationPermission';
import { useVisibility } from './useVisibility';

const BROADCAST_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Continuously broadcasts user location when visibility is not "hidden"
 */
export function useLocationBroadcast() {
  const { user } = useSupabaseSession();
  const { getCurrentLocation } = useLocationPermission();
  const { visibilityMode } = useVisibility();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        const loc = await getCurrentLocation();
        if (!loc) return;

        await supabase
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
