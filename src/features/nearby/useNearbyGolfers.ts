import { useQuery } from '@tanstack/react-query';
import { isMockNearby } from './config';
import { getMockNearby } from './mockNearbyGolfers';
import { NearbyGolfer } from './types';

async function fetchLiveNearby(): Promise<NearbyGolfer[]> {
  // TODO: wire to Supabase / presence service (distance + same_club server-side if possible)
  return [];
}

export function useNearbyGolfers() {
  return useQuery({
    queryKey: ['nearbyGolfers', isMockNearby ? 'mock' : 'live'],
    queryFn: () => isMockNearby ? Promise.resolve(getMockNearby(5)) : fetchLiveNearby(),
    staleTime: 15_000,
  });
}
