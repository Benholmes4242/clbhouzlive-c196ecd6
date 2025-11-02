import { useState } from 'react';

export type GameSort = 'soonest' | 'distance' | 'seats';
export type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening';

export type WhenFilter = {
  date: Date | null;
  window: TimeWindow;
  exactTime: string | null; // 'HH:mm'
};

export function useGameFilters() {
  const [when, setWhenState] = useState<WhenFilter | null>(null);

  const setWhen = (next: WhenFilter | null | Partial<WhenFilter>) => {
    if (next === null) {
      setWhenState(null);
      return;
    }
    setWhenState(prev => {
      if (!prev) {
        return next as WhenFilter;
      }
      return {
        ...prev,
        ...next,
        // exactTime overrides window; window clears exactTime
        window: (next as any).exactTime ? 'any' : ((next as any).window ?? prev.window),
        exactTime: (next as any).window && (next as any).window !== 'any' ? null : ((next as any).exactTime ?? prev.exactTime),
      };
    });
  };

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [sort, setSort] = useState<GameSort | null>(null);

  const sortLabel = sort === null ? 'Sort' : sort === 'soonest' ? 'Soonest' : sort === 'distance' ? 'Nearest' : 'Most Available Slots';

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
