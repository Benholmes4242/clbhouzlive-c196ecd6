import type { WhsScore } from '@/lib/whs/types';

export type StablefordScope = '30d' | '90d' | 'all';

export interface StablefordDistribution {
  total: number;
  inZoneCount: number;
  solidCount: number;
  offDayCount: number;
  inZonePct: number;
  solidPct: number;
  offDayPct: number;
  avg: number | null;
  /** Avg for the previous comparable window. Null for 'all' scope or if no prev data. */
  prevAvg: number | null;
  /** Avg delta (current - prev). Null if no comparison available. */
  deltaVsPrev: number | null;
  insufficientData: boolean;
  scope: StablefordScope;
}

const MIN_ROUNDS = 3;
const IN_ZONE_THRESHOLD = 36;
const SOLID_LOWER = 33;

const SCOPE_DAYS: Record<Exclude<StablefordScope, 'all'>, number> = {
  '30d': 30,
  '90d': 90,
};

function isValid(s: WhsScore): s is WhsScore & { stableford_points: number } {
  return s.stableford_points !== null && s.stableford_points !== undefined;
}

function computeAvg(
  window: Array<WhsScore & { stableford_points: number }>,
): number | null {
  if (window.length === 0) return null;
  const sum = window.reduce((acc, s) => acc + s.stableford_points, 0);
  return sum / window.length;
}

export function computeStablefordDistribution(
  scores: WhsScore[],
  scope: StablefordScope = '90d',
): StablefordDistribution {
  const valid = scores
    .filter(isValid)
    .sort(
      (a, b) =>
        new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
    );

  const now = Date.now();

  let currentWindow: typeof valid;
  let prevWindow: typeof valid;

  if (scope === 'all') {
    currentWindow = valid;
    prevWindow = [];
  } else {
    const days = SCOPE_DAYS[scope];
    const cutoffMs = days * 86_400_000;
    const currentStart = now - cutoffMs;
    const prevStart = now - 2 * cutoffMs;

    currentWindow = valid.filter(
      (s) => new Date(s.play_date).getTime() >= currentStart,
    );
    prevWindow = valid.filter((s) => {
      const t = new Date(s.play_date).getTime();
      return t >= prevStart && t < currentStart;
    });
  }

  const total = currentWindow.length;

  if (total < MIN_ROUNDS) {
    return {
      total,
      inZoneCount: 0,
      solidCount: 0,
      offDayCount: 0,
      inZonePct: 0,
      solidPct: 0,
      offDayPct: 0,
      avg: null,
      prevAvg: null,
      deltaVsPrev: null,
      insufficientData: true,
      scope,
    };
  }

  let inZoneCount = 0;
  let solidCount = 0;
  let offDayCount = 0;
  let sum = 0;

  for (const s of currentWindow) {
    const pts = s.stableford_points;
    sum += pts;
    if (pts >= IN_ZONE_THRESHOLD) inZoneCount += 1;
    else if (pts >= SOLID_LOWER) solidCount += 1;
    else offDayCount += 1;
  }

  const inZonePct = Math.round((inZoneCount / total) * 100);
  const solidPct = Math.round((solidCount / total) * 100);
  const offDayPct = 100 - inZonePct - solidPct;

  const avg = sum / total;
  const prevAvg = computeAvg(prevWindow);
  const deltaVsPrev =
    prevAvg !== null && prevWindow.length >= MIN_ROUNDS ? avg - prevAvg : null;

  return {
    total,
    inZoneCount,
    solidCount,
    offDayCount,
    inZonePct,
    solidPct,
    offDayPct,
    avg,
    prevAvg,
    deltaVsPrev,
    insufficientData: false,
    scope,
  };
}
