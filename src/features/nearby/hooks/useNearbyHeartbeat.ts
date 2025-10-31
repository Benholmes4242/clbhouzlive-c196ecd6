import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type GetPayload = () => Promise<{
  user_id: string;
  visibility_mode: 'hidden' | 'friends' | 'all';
  lat: number | null;
  lng: number | null;
} | null>;

export function useNearbyHeartbeat(getPayload: GetPayload) {
  const queryClient = useQueryClient();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const beat = async () => {
      const payload = await getPayload();
      if (!mounted || !payload) return;

      // Only write when visible
      if (payload.visibility_mode === 'hidden') return;

      const { user_id, visibility_mode, lat, lng } = payload;

      // Upsert with a fresh timestamp
      const { error } = await supabase
        .from('user_nearby_status')
        .upsert({
          user_id,
          visibility_mode,
          lat,
          lng,
          last_location_update: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (!error) {
        // Keep the UI fresh
        queryClient.invalidateQueries({
          predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'nearbyGolfers',
        });
      } else {
        console.warn('[NEARBY] heartbeat upsert error', error);
      }
    };

    // Fire once immediately on mount/foreground
    beat();

    // Repeat every 120s while in foreground
    timerRef.current = window.setInterval(beat, 120_000);

    // Re-fire whenever we return to foreground
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mounted = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [getPayload, queryClient]);
}
