import { useState } from 'react';

export type GameSort = 'soonest' | 'distance' | 'seats';
export type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening';

export type WhenFilter = {
  date: Date | null;
  window: TimeWindow;
  exactTime: string | null; // 'HH:mm'
};

export function useGameFilters() {
  const [when, setWhenState] = useState<WhenFilter>({
    date: null,
    window: 'any',
    exactTime: null,
  });

  const setWhen = (next: Partial<WhenFilter>) =>
    setWhenState(prev => ({
      ...prev,
      ...next,
      // exactTime overrides window; window clears exactTime
      window: next.exactTime ? 'any' : (next.window ?? prev.window),
      exactTime: next.window && next.window !== 'any' ? null : (next.exactTime ?? prev.exactTime),
    }));

  const [distanceKm, setDistanceKm] = useState(10);
  const [sort, setSort] = useState<GameSort>('soonest');

  const sortLabel = sort === 'soonest' ? 'Soonest' : sort === 'distance' ? 'Nearest' : 'Most Available Slots';

  return {
    when,
    setWhen,
    distanceKm,
    setDistanceKm,
    sort,
    setSort,
    sortLabel,
  };
}
