export type Timeframe = '7d' | '30d' | '90d' | '12m' | 'all';

export interface TimeWindow {
  start: Date | null;
  end: Date;
  label: string;
}

/**
 * Returns a consistent time window based on the selected timeframe.
 * Single source of truth for all time-based filtering in Friends Courses.
 */
export function getTimeWindow(timeframe: Timeframe, now = new Date()): TimeWindow {
  if (timeframe === 'all') {
    return { start: null, end: now, label: 'All time (recent)' };
  }

  const start = new Date(now);
  let label = '';

  switch (timeframe) {
    case '7d':
      start.setDate(start.getDate() - 7);
      label = 'Last 7 days';
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      label = 'Last 30 days';
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      label = 'Last 90 days';
      break;
    case '12m':
      start.setFullYear(start.getFullYear() - 1);
      label = 'Last 12 months';
      break;
  }

  return { start, end: now, label };
}

/**
 * Helper to get ISO string for Supabase queries
 */
export function getTimeWindowISO(timeframe: Timeframe, now = new Date()) {
  const { start, end } = getTimeWindow(timeframe, now);
  return {
    startISO: start?.toISOString() ?? null,
    endISO: end.toISOString(),
  };
}
