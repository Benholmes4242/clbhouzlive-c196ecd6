import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type PresenceStatus = 'online' | 'away' | 'offline';

export interface UserPresence {
  status: PresenceStatus;
  last_seen_at: string;
}

export function usePresence() {
  const { user } = useSupabaseSession();
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribedUsersRef = useRef<Set<string>>(new Set());
  const presenceChannelsRef = useRef<RealtimeChannel[]>([]);

  // Update own presence
  const updatePresence = useCallback(async (status: PresenceStatus) => {
    if (!user) return;
    
    try {
      await supabase.rpc('update_presence', { p_status: status });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Get presence for a single user
  const getPresence = useCallback(async (userId: string): Promise<UserPresence | null> => {
    const { data, error } = await supabase
      .from('user_presence')
      .select('status, last_seen_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      status: data.status as PresenceStatus,
      last_seen_at: data.last_seen_at,
    };
  }, []);

  // Subscribe to presence for multiple users
  const subscribeToPresence = useCallback((userIds: string[]) => {
    const newUsers = userIds.filter(id => !subscribedUsersRef.current.has(id));
    if (newUsers.length === 0) return;

    newUsers.forEach(id => subscribedUsersRef.current.add(id));

    // Fetch initial presence for new users
    const fetchPresence = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen_at')
        .in('user_id', newUsers);

      setPresenceMap(prev => {
        const newMap = new Map(prev);
        data?.forEach(p => {
          newMap.set(p.user_id, {
            status: p.status as PresenceStatus,
            last_seen_at: p.last_seen_at,
          });
        });
        return newMap;
      });
    };

    fetchPresence();

    // Subscribe realtime for these specific users
    const channelName = `presence-${newUsers.sort().join('-').slice(0, 50)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        (payload) => {
          const data = payload.new as { user_id: string; status: PresenceStatus; last_seen_at: string };
          if (subscribedUsersRef.current.has(data.user_id)) {
            setPresenceMap(prev => {
              const newMap = new Map(prev);
              newMap.set(data.user_id, { status: data.status, last_seen_at: data.last_seen_at });
              return newMap;
            });
          }
        }
      )
      .subscribe();

    presenceChannelsRef.current.push(channel);
  }, []);

  // Manage own presence based on visibility
  useEffect(() => {
    if (!user) return;

    // Set online on mount
    updatePresence('online');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    const handleFocus = () => updatePresence('online');
    const handleBlur = () => updatePresence('away');

    const handleBeforeUnload = () => {
      navigator.sendBeacon?.(
        `https://ybxkehyomcakqjvuhnna.supabase.co/rest/v1/rpc/update_presence`,
        JSON.stringify({ p_status: 'offline' })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    updateIntervalRef.current = setInterval(() => {
      if (!document.hidden) {
        updatePresence('online');
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      // Clean up presence channels
      presenceChannelsRef.current.forEach(ch => supabase.removeChannel(ch));
      presenceChannelsRef.current = [];
      
      updatePresence('offline');
    };
  }, [user, updatePresence]);

  return {
    presenceMap,
    getPresence,
    subscribeToPresence,
    updatePresence,
  };
}
