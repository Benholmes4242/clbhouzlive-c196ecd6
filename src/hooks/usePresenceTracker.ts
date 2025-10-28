import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { channelManager } from '@/utils/supabaseChannelManager';

/**
 * Tracks the current user's presence on the presence:creators_online channel.
 * This broadcasts to all other clients that this user is currently online.
 * Must be called once at the app level (e.g., in App.tsx).
 */
export function usePresenceTracker() {
  useEffect(() => {
    let channel: any = null;

    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Presence] No authenticated user, skipping presence tracking');
        return;
      }

      const channelName = 'presence:creators_online';
      console.log('[Presence] Creating channel:', channelName);

      channel = channelManager.createChannel(channelName, { config: { presence: { key: user.id }}});

      channel.subscribe(async (status: string) => {
        console.log('[Presence] Channel status:', status);
        if (status === 'SUBSCRIBED') {
          const trackStatus = await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          console.log('[Presence] Track status:', trackStatus, 'for user:', user.id);
        }
      });
    };

    run();

    return () => {
      console.log('[Presence] Cleaning up presence tracker');
      if (channel) {
        channelManager.removeChannel('presence:creators_online');
      }
    };
  }, []);
}
