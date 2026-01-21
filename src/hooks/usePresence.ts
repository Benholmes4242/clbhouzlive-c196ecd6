import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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
      if (newUsers.length === 0) return;
      
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen_at')
        .in('user_id', newUsers);

      if (error) {
        console.error('Error fetching presence:', error);
        return;
      }

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
  }, []);

  // Manage own presence based on visibility
  useEffect(() => {
    if (!user) return;

    // Set online on mount
    updatePresence('online');

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    // Handle window focus/blur
    const handleFocus = () => updatePresence('online');
    const handleBlur = () => updatePresence('away');

    // Handle before unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const formData = new FormData();
      formData.append('status', 'offline');
      navigator.sendBeacon?.(
        `https://ybxkehyomcakqjvuhnna.supabase.co/rest/v1/rpc/update_presence`,
        JSON.stringify({ p_status: 'offline' })
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Periodic heartbeat to keep online status
    updateIntervalRef.current = setInterval(() => {
      if (!document.hidden) {
        updatePresence('online');
      }
    }, 60000); // Every minute

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      // Set offline on unmount
      updatePresence('offline');
    };
  }, [user, updatePresence]);

  // Subscribe to realtime presence updates
  useEffect(() => {
    if (subscribedUsersRef.current.size === 0) return;

    const channel = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          const data = payload.new as { user_id: string; status: PresenceStatus; last_seen_at: string };
          if (subscribedUsersRef.current.has(data.user_id)) {
            setPresenceMap(prev => {
              const newMap = new Map(prev);
              newMap.set(data.user_id, {
                status: data.status,
                last_seen_at: data.last_seen_at,
              });
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    presenceMap,
    getPresence,
    subscribeToPresence,
    updatePresence,
  };
}
