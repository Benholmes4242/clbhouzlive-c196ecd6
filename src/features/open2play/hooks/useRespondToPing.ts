import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PingResponse } from '../types';
import { OPEN2PLAY_CONFIG } from '../config';
import { mockStore } from '../mock/mockData';
import { nanoid } from 'nanoid';

export function useRespondToPing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respond = async (pingId: string, message?: string): Promise<PingResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      if (OPEN2PLAY_CONFIG.dataSource === 'mock') {
        return createMockResponse(pingId, message);
      }

      const { data, error } = await supabase.functions.invoke(`pings/${pingId}/respond`, {
        body: { message },
        method: 'POST',
      });

      if (error) throw error;
      return data.response;
    } catch (err: any) {
      setError(err.message || 'Failed to respond to ping');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { respond, loading, error };
}

function createMockResponse(pingId: string, message?: string): PingResponse {
  const ping = mockStore.pings.find(p => p.id === pingId);
  if (!ping || ping.status !== 'ACTIVE' || new Date(ping.expires_at) < new Date()) {
    throw new Error('PING_CLOSED');
  }

  const existing = mockStore.responses.find(
    r => r.ping_id === pingId && r.responder_id === 'current-user'
  );
  if (existing) {
    throw new Error('ALREADY_RESPONDED');
  }

  const response: PingResponse = {
    id: `mock-response-${nanoid()}`,
    ping_id: pingId,
    responder_id: 'current-user',
    message,
    state: 'PENDING',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockStore.responses.push(response);
  console.log('[Mock] Created response:', response.id);

  return response;
}
