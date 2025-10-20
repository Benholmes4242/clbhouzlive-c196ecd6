import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OPEN2PLAY_CONFIG } from '../config';
import { mockStore } from '../mock/mockData';

export function useClosePing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = async (pingId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (OPEN2PLAY_CONFIG.dataSource === 'mock') {
        return closeMockPing(pingId);
      }

      const { error } = await supabase.functions.invoke(`pings/${pingId}/close`, {
        method: 'POST',
      });

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to close ping');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { close, loading, error };
}

function closeMockPing(pingId: string): boolean {
  const ping = mockStore.pings.find(p => p.id === pingId);
  if (!ping) {
    throw new Error('Ping not found');
  }

  ping.status = 'CLOSED';
  ping.updated_at = new Date().toISOString();

  // Expire pending responses
  mockStore.responses
    .filter(r => r.ping_id === pingId && r.state === 'PENDING')
    .forEach(r => {
      r.state = 'EXPIRED';
      r.updated_at = new Date().toISOString();
    });

  console.log('[Mock] Closed ping:', pingId);
  return true;
}
