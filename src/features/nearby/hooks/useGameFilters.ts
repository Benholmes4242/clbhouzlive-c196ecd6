import { useState } from 'react';

export type GameSort = 'soonest' | 'distance' | 'seats';

export function useGameFilters() {
  const [distanceKm, setDistanceKm] = useState(10);
  const [sort, setSort] = useState<GameSort>('soonest');

  return {
    distanceKm,
    setDistanceKm,
    sort,
    setSort,
  };
}
