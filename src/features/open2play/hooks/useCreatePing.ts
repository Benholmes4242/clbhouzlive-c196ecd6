import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreatePingInput, Ping } from '../types';
import { OPEN2PLAY_CONFIG } from '../config';
import { mockStore, initializeMockData } from '../mock/mockData';
import { nanoid } from 'nanoid';

export function useCreatePing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: CreatePingInput): Promise<Ping | null> => {
    setLoading(true);
    setError(null);

    try {
      if (OPEN2PLAY_CONFIG.dataSource === 'mock') {
        return createMockPing(input);
      }

      const { data, error } = await supabase.functions.invoke('pings', {
        body: input,
        method: 'POST',
      });

      if (error) throw error;
      return data.ping;
    } catch (err: any) {
      setError(err.message || 'Failed to create ping');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

function createMockPing(input: CreatePingInput): Ping {
  initializeMockData();

  // Check for existing active ping
  const existingActive = mockStore.pings.find(p => p.status === 'ACTIVE');
  if (existingActive) {
    throw new Error('ACTIVE_PING_EXISTS');
  }

  const now = new Date();
  const duration = Math.min(input.durationMins || 20, 60);
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

  const ping: Ping = {
    id: `mock-ping-${nanoid()}`,
    creator_id: 'current-user', // Would be actual user in real app
    club_id: input.clubId,
    lat: input.lat,
    lng: input.lng,
    players_needed: input.playersNeeded,
    format: input.format,
    visibility: input.visibility,
    is_anonymous: input.isAnonymous,
    note: input.note,
    expires_at: expiresAt.toISOString(),
    status: 'ACTIVE',
    created_at: now.toISOString(),
  };

  mockStore.pings.push(ping);
  console.log('[Mock] Created ping:', ping.id);

  return ping;
}
