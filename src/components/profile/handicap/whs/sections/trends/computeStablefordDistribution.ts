import type { WhsScore } from '@/lib/whs/types';

export interface StablefordDistribution {
  total: number;
  inZoneCount: number;
  solidCount: number;
  offDayCount: number;
  inZonePct: number;
  solidPct: number;
  offDayPct: number;
  avg: number | null;
  insufficientData: boolean;
}

const WINDOW_SIZE = 20;
const MIN_ROUNDS = 3;
const IN_ZONE_THRESHOLD = 36;
const SOLID_LOWER = 33;

export function computeStablefordDistribution(
  scores: WhsScore[],
): StablefordDistribution {
  const valid = scores
    .filter(
      (s): s is WhsScore & { stableford_points: number } =>
        s.stableford_points !== null && s.stableford_points !== undefined,
    )
    .sort(
      (a, b) =>
        new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
    );

  const window = valid.slice(0, WINDOW_SIZE);
  const total = window.length;

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
      insufficientData: true,
    };
  }

  let inZoneCount = 0;
  let solidCount = 0;
  let offDayCount = 0;
  let sum = 0;

  for (const s of window) {
    const pts = s.stableford_points;
    sum += pts;
    if (pts >= IN_ZONE_THRESHOLD) inZoneCount += 1;
    else if (pts >= SOLID_LOWER) solidCount += 1;
    else offDayCount += 1;
  }

  const inZonePct = Math.round((inZoneCount / total) * 100);
  const solidPct = Math.round((solidCount / total) * 100);
  const offDayPct = 100 - inZonePct - solidPct;

  return {
    total,
    inZoneCount,
    solidCount,
    offDayCount,
    inZonePct,
    solidPct,
    offDayPct,
    avg: sum / total,
    insufficientData: false,
  };
}
