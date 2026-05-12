import type { WhsScore } from '@/lib/whs/types';

export type FormVerdict = 'in_form' | 'building' | 'steady' | 'slipping' | 'cold' | 'unknown';

export interface HandicapPrediction {
  current: number | null;
  projected: number | null;
  delta: number;
  direction: 'down' | 'up' | 'flat';
  recentFormAvg: number | null;
  countersAvg: number | null;
  verdict: FormVerdict;
  totalRounds: number;
  insufficientData: boolean;
}

const RECENT_FORM_N = 5;
const PROJECT_N = 5;
const WINDOW_SIZE = 20;
const COUNTERS = 8;
const MEANINGFUL_DELTA = 0.2;

function handicapFromWindow(diffs: number[]): number | null {
  if (diffs.length < COUNTERS) return null;
  const sorted = [...diffs].sort((a, b) => a - b);
  const counters = sorted.slice(0, COUNTERS);
  return counters.reduce((sum, d) => sum + d, 0) / counters.length;
}

export function predictHandicap(scores: WhsScore[]): HandicapPrediction {
  const valid = scores
    .filter((s) => s.handicap_differential !== null)
    .sort(
      (a, b) =>
        new Date(b.play_date).getTime() - new Date(a.play_date).getTime(),
    );

  const totalRounds = valid.length;

  if (totalRounds < COUNTERS) {
    return {
      current: null,
      projected: null,
      delta: 0,
      direction: 'flat',
      recentFormAvg: null,
      countersAvg: null,
      verdict: 'unknown',
      totalRounds,
      insufficientData: true,
    };
  }

  const windowSize = Math.min(WINDOW_SIZE, totalRounds);
  const recentScores = valid.slice(0, windowSize);
  const windowDiffs = recentScores.map((s) => s.handicap_differential as number);

  const current = handicapFromWindow(windowDiffs);
  const countersAvg = current;

  const recentN = Math.min(RECENT_FORM_N, recentScores.length);
  const recentDiffs = windowDiffs.slice(0, recentN);
  const recentFormAvg = recentDiffs.reduce((sum, d) => sum + d, 0) / recentN;

  const newestKeep = windowDiffs.slice(0, Math.max(0, windowSize - PROJECT_N));
  const futureWindow = [
    ...newestKeep,
    ...Array(PROJECT_N).fill(recentFormAvg),
  ];
  const projected = handicapFromWindow(futureWindow);

  let direction: 'down' | 'up' | 'flat' = 'flat';
  let delta = 0;
  if (current !== null && projected !== null) {
    delta = Math.abs(projected - current);
    if (delta < MEANINGFUL_DELTA) {
      direction = 'flat';
    } else {
      direction = projected < current ? 'down' : 'up';
    }
  }

  const verdict = computeVerdict({
    direction,
    recentFormAvg,
    countersAvg,
  });

  return {
    current,
    projected,
    delta,
    direction,
    recentFormAvg,
    countersAvg,
    verdict,
    totalRounds,
    insufficientData: false,
  };
}

function computeVerdict({
  direction,
  recentFormAvg,
  countersAvg,
}: {
  direction: 'down' | 'up' | 'flat';
  recentFormAvg: number | null;
  countersAvg: number | null;
}): FormVerdict {
  if (recentFormAvg === null || countersAvg === null) return 'unknown';
  const gap = recentFormAvg - countersAvg;
  if (direction === 'down') {
    return gap < -1.0 ? 'in_form' : 'building';
  }
  if (direction === 'up') {
    return gap > 2.0 ? 'cold' : 'slipping';
  }
  if (gap < -0.5) return 'building';
  return 'steady';
}

export interface VerdictMeta {
  label: string;
  description: string;
  why: (recentFormAvg: number, countersAvg: number) => string;
  theme: 'positive' | 'neutral' | 'negative';
}

export const VERDICT_META: Record<FormVerdict, VerdictMeta> = {
  in_form: {
    label: 'In form',
    description:
      'Recent rounds are better than your counters. Your handicap is set to drop.',
    why: (recent, counters) =>
      `Your last 5 rounds averaged ${recent.toFixed(1)} — that's ${(counters - recent).toFixed(1)} below your current 8 counters. Keep playing at this level and your handicap will move.`,
    theme: 'positive',
  },
  building: {
    label: 'Building',
    description:
      'Recent rounds are improving, but not yet enough to move your handicap.',
    why: (recent, counters) =>
      `Your last 5 rounds averaged ${recent.toFixed(1)} — slightly below your ${counters.toFixed(1)} counters. A few more strong rounds and your handicap will start to drop.`,
    theme: 'positive',
  },
  steady: {
    label: 'Steady',
    description:
      'Your form is consistent. Handicap holding around its current level.',
    why: (recent, counters) =>
      `Your last 5 rounds averaged ${recent.toFixed(1)} — almost exactly in line with your ${counters.toFixed(1)} counters. Your handicap is sitting where it should.`,
    theme: 'neutral',
  },
  slipping: {
    label: 'Slipping',
    description:
      'Recent rounds are above your counters. Handicap may drift up.',
    why: (recent, counters) =>
      `Your last 5 rounds averaged ${recent.toFixed(1)} — above your ${counters.toFixed(1)} counters. If this continues, weaker rounds will start replacing your stronger ones.`,
    theme: 'negative',
  },
  cold: {
    label: 'Cold',
    description:
      'Recent rounds are well above your counters. Your handicap is set to rise.',
    why: (recent, counters) =>
      `Your last 5 rounds averaged ${recent.toFixed(1)} — that's ${(recent - counters).toFixed(1)} above your current 8 counters. Those rounds will start replacing your stronger counters.`,
    theme: 'negative',
  },
  unknown: {
    label: 'Not enough data',
    description:
      'Need at least 8 rounds to compute a handicap and a projection.',
    why: () => '',
    theme: 'neutral',
  },
};
