import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PingCard } from '../types';
import { OPEN2PLAY_CONFIG } from '../config';
import { mockStore, initializeMockData, calculateDistance, getMockUserProfile } from '../mock/mockData';

interface UseNearbyPingsParams {
  scope?: 'friends' | 'nearby' | 'all';
  lat?: number;
  lng?: number;
  clubId?: string;
}

export function useNearbyPings(params: UseNearbyPingsParams = {}) {
  const [pings, setPings] = useState<PingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPings = async () => {
    setLoading(true);
    setError(null);

    try {
      if (OPEN2PLAY_CONFIG.dataSource === 'mock') {
        const mockPings = await fetchMockPings(params);
        setPings(mockPings);
      } else {
        const searchParams = new URLSearchParams({
          scope: params.scope || 'nearby',
          lat: params.lat?.toString() || '0',
          lng: params.lng?.toString() || '0',
          limit: '20',
        });

        const { data, error } = await supabase.functions.invoke(
          `pings?${searchParams.toString()}`,
          { method: 'GET' }
        );

        if (error) throw error;
        setPings(data.items || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPings();

    // Subscribe to realtime updates
    if (OPEN2PLAY_CONFIG.dataSource === 'live') {
      const channel = supabase
        .channel('pings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pings',
          },
          () => {
            fetchPings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [params.scope, params.lat, params.lng]);

  return { pings, loading, error, refetch: fetchPings };
}

async function fetchMockPings(params: UseNearbyPingsParams): Promise<PingCard[]> {
  initializeMockData();

  const userLat = params.lat || 53.5;
  const userLng = params.lng || -2.5;

  // Filter active pings
  const activePings = mockStore.pings.filter(
    p => p.status === 'ACTIVE' && new Date(p.expires_at) > new Date()
  );

  // Transform to cards with privacy
  const cards: PingCard[] = activePings.map(ping => {
    const distance = calculateDistance(userLat, userLng, ping.lat || 0, ping.lng || 0);

    if (ping.is_anonymous) {
      const creator = getMockUserProfile(ping.creator_id);
      return {
        id: ping.id,
        clubId: ping.club_id,
        clubName: ping.club?.name,
        format: ping.format,
        playersNeeded: ping.players_needed,
        visibility: ping.visibility,
        note: ping.note,
        expiresAt: ping.expires_at,
        isAnonymous: true,
        homeClub: creator.home_club,
        handicap: creator.handicap,
        distance,
      };
    } else {
      const creator = getMockUserProfile(ping.creator_id);
      return {
        id: ping.id,
        creator,
        clubId: ping.club_id,
        clubName: ping.club?.name,
        format: ping.format,
        playersNeeded: ping.players_needed,
        visibility: ping.visibility,
        note: ping.note,
        expiresAt: ping.expires_at,
        isAnonymous: false,
        distance,
      };
    }
  });

  // Sort by distance
  return cards.sort((a, b) => (a.distance || 0) - (b.distance || 0));
}
