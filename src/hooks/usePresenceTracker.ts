import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { channelManager } from '@/utils/supabaseChannelManager';

/**
 * Tracks the current user's presence on the presence:creators_online channel.
 * This broadcasts to all other clients that this user is currently online.
 * Must be called once at the app level (e.g., in App.tsx).
 * 
 * STABILITY FIX: Added guards to prevent rapid channel recreation:
 * - mountedRef to prevent operations after unmount
 * - subscribingRef to prevent concurrent subscription attempts
 * - Early return if channel is already active
 */
export function usePresenceTracker() {
  const mountedRef = useRef(true);
  const subscribingRef = useRef(false);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const run = async () => {
      // Prevent concurrent subscription attempts
      if (subscribingRef.current) {
        console.log('[Presence] Already subscribing, skipping');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Check mount status after async call
      if (!mountedRef.current) return;
      
      if (!user) {
        console.log('[Presence] No authenticated user, skipping presence tracking');
        return;
      }

      // Skip if already tracked in this session
      if (hasTrackedRef.current) {
        console.log('[Presence] Already tracking presence, skipping');
        return;
      }

      const channelName = 'presence:creators_online';
      
      // Check if channel already exists and is usable
      if (channelManager.hasChannel(channelName)) {
        console.log('[Presence] Reusing existing channel');
        hasTrackedRef.current = true;
        return;
      }

      subscribingRef.current = true;
      console.log('[Presence] Creating channel:', channelName);

      try {
        const channel = channelManager.createChannel(channelName, { 
          config: { presence: { key: user.id } }
        });

        channel.subscribe(async (status: string) => {
          // Check mount status before processing
          if (!mountedRef.current) {
            subscribingRef.current = false;
            return;
          }
          
          console.log('[Presence] Channel status:', status);
          
          if (status === 'SUBSCRIBED') {
            const trackStatus = await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            console.log('[Presence] Track status:', trackStatus, 'for user:', user.id);
            hasTrackedRef.current = true;
          }
          
          subscribingRef.current = false;
        });
      } catch (error) {
        console.error('[Presence] Failed to create channel:', error);
        subscribingRef.current = false;
      }
    };

    run();

    return () => {
      console.log('[Presence] Cleaning up presence tracker');
      mountedRef.current = false;
      // Release our reference to the channel
      // The channelManager will only actually remove it when all refs are gone
      channelManager.removeChannel('presence:creators_online');
    };
  }, []);
}
