import { useEffect, useMemo, useState } from 'react';

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

/**
 * Live-ticking countdown to a target ISO date.
 * Ticks once per second. Returns null when expired or when no startDate provided.
 *
 * NOTE: Uses local-time parsing for date-only strings (legacy behavior preserved
 * from the inline implementation in TourHeroHelpers.UpcomingCountdown).
 * TZ-drift bug for date-only inputs is preserved in this extraction —
 * fix is logged as a separate hotfix brief.
 */
export function useCountdown(startDate: string | null | undefined): CountdownValue | null {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!startDate) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [startDate]);

  return useMemo(() => {
    if (!startDate) return null;
    const normalized = startDate.includes('T') ? startDate : `${startDate}T12:00:00`;
    const diff = new Date(normalized).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      totalMs: diff,
      expired: false,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, tick]);
}
