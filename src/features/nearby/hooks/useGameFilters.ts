import { useState } from 'react';

export type GameSort = 'soonest' | 'distance' | 'seats';
export type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening';

export function useGameFilters() {
  const [date, setDate] = useState<Date | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('any');
  const [distanceKm, setDistanceKm] = useState(10);
  const [sort, setSort] = useState<GameSort>('soonest');

  const sortLabel = sort === 'soonest' ? 'Soonest' : sort === 'distance' ? 'Nearest' : 'Seats';

  return {
    date,
    setDate,
    timeWindow,
    setTimeWindow,
    distanceKm,
    setDistanceKm,
    sort,
    setSort,
    sortLabel,
  };
}
