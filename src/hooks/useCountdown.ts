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
 * Date parsing rules:
 *   - Date-only ISO (e.g. "2026-04-30")     → parsed as UTC midnight.
 *   - Full ISO with time/tz                 → passed to `new Date()` unchanged.
 *
 * The UTC-midnight rule eliminates a long-standing TZ-drift bug where date-only
 * inputs were parsed in local time, causing the countdown to jump around
 * midnight depending on the viewer's timezone.
 */
function parseTournamentStart(isoString: string): Date {
  // Date-only string (e.g. "2026-04-30") — parse as UTC midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    return new Date(`${isoString}T00:00:00.000Z`);
  }
  // Full ISO datetime — parse normally.
  return new Date(isoString);
}

export function useCountdown(startDate: string | null | undefined): CountdownValue | null {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!startDate) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [startDate]);

  return useMemo(() => {
    if (!startDate) return null;
    const diff = parseTournamentStart(startDate).getTime() - Date.now();
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
