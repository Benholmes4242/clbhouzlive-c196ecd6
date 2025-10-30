import { useEffect, useRef } from 'react';
import { createNearbyPresenceChannel, PresencePayload } from '@/lib/presence/nearbyPresence';
import { supabase } from '@/integrations/supabase/client';

type Args = {
  getCurrentPayload: () => Promise<PresencePayload | null>;
};

export function useNearbyPresencePublisher({ getCurrentPayload }: Args) {
  const chRef = useRef<ReturnType<typeof createNearbyPresenceChannel> | null>(null);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;

    const mount = async () => {
      const ch = createNearbyPresenceChannel();

      ch
        .on('presence', { event: 'sync' }, () => {
          // optional: console.debug('[Presence] sync', ch.presenceState());
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const payload = await getCurrentPayload();
            if (payload && payload.visibility_mode !== 'hidden') {
              await ch.track(payload);
            }
          }
        });

      chRef.current = ch;

      // keep websocket auth fresh
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token);
        }
      });
      unsubAuth = () => subscription.unsubscribe();

      // re-track on visibility change (foreground again)
      const onVisible = async () => {
        if (document.visibilityState !== 'visible') return;
        const payload = await getCurrentPayload();
        if (payload && payload.visibility_mode !== 'hidden') {
          await ch.track(payload);
        }
      };
      document.addEventListener('visibilitychange', onVisible);

      // cleanup
      return () => {
        document.removeEventListener('visibilitychange', onVisible);
      };
    };

    const cleanupPromise = mount();

    return () => {
      if (unsubAuth) unsubAuth();
      cleanupPromise.then((cleanup) => cleanup && cleanup());
      const ch = chRef.current;
      if (ch) supabase.removeChannel(ch);
    };
  }, [getCurrentPayload]);
}
