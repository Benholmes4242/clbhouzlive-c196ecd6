import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ping } from '../types';
import { OPEN2PLAY_CONFIG } from '../config';
import { mockStore, initializeMockData } from '../mock/mockData';

export function useActivePing() {
  const [ping, setPing] = useState<Ping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePing = async () => {
    setLoading(true);
    setError(null);

    try {
      if (OPEN2PLAY_CONFIG.dataSource === 'mock') {
        const mockPing = fetchMockActivePing();
        setPing(mockPing);
      } else {
        const { data, error } = await supabase.functions.invoke('pings/me/active', {
          method: 'GET',
        });

        if (error) throw error;
        setPing(data.ping || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active ping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePing();

    // Subscribe to realtime updates
    if (OPEN2PLAY_CONFIG.dataSource === 'live') {
      const channel = supabase
        .channel('my-pings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pings',
            filter: `creator_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`,
          },
          () => {
            fetchActivePing();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  return { ping, loading, error, refetch: fetchActivePing };
}

function fetchMockActivePing(): Ping | null {
  initializeMockData();

  const activePing = mockStore.pings.find(
    p => p.creator_id === 'current-user' && p.status === 'ACTIVE'
  );

  return activePing || null;
}
