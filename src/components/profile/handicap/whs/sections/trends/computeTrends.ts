import { format, isAfter, startOfDay, subDays, subWeeks, differenceInDays } from 'date-fns';
import { TrendingDown, Target, Flag } from 'lucide-react';
import type { WhsScore } from '@/lib/whs/types';
import type { TrendBucket, TrendMetric, TrendRange } from './types';

function getBucketSpec(range: TrendRange): { count: number; unit: 'day' | 'week' } {
  switch (range) {
    case '7d':
      return { count: 7, unit: 'day' };
    case '1m':
      return { count: 30, unit: 'day' };
    case '6m':
      return { count: 26, unit: 'week' };
  }
}

function emptyBuckets(range: TrendRange): TrendBucket[] {
  const { count, unit } = getBucketSpec(range);
  const today = startOfDay(new Date());
  const out: TrendBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = unit === 'day' ? subDays(today, i) : subWeeks(today, i);
    const labelFmt = unit === 'day' ? (count <= 7 ? 'EEE' : 'd MMM') : 'd MMM';
    out.push({ label: format(d, labelFmt), date: d, value: null });
  }
  return out;
}

function bucketIndexFor(scoreDate: Date, buckets: TrendBucket[], unit: 'day' | 'week'): number {
  if (buckets.length === 0) return -1;
  const first = buckets[0].date;
  if (scoreDate < first) return -1;
  const days = differenceInDays(scoreDate, first);
  const idx = unit === 'day' ? days : Math.floor(days / 7);
  if (idx < 0 || idx >= buckets.length) return -1;
  return idx;
}

function fillDiffBuckets(scores: WhsScore[], buckets: TrendBucket[], unit: 'day' | 'week') {
  const sums = new Array(buckets.length).fill(0);
  const counts = new Array(buckets.length).fill(0);
  for (const s of scores) {
    if (s.handicap_differential === null) continue;
    const idx = bucketIndexFor(new Date(s.play_date), buckets, unit);
    if (idx < 0) continue;
    sums[idx] += s.handicap_differential;
    counts[idx] += 1;
  }
  return buckets.map((b, i) => ({ ...b, value: counts[i] > 0 ? sums[i] / counts[i] : null }));
}

function fillStablefordBuckets(scores: WhsScore[], buckets: TrendBucket[], unit: 'day' | 'week') {
  const sums = new Array(buckets.length).fill(0);
  const counts = new Array(buckets.length).fill(0);
  for (const s of scores) {
    if (s.stableford_points === null) continue;
    const idx = bucketIndexFor(new Date(s.play_date), buckets, unit);
    if (idx < 0) continue;
    sums[idx] += s.stableford_points;
    counts[idx] += 1;
  }
  return buckets.map((b, i) => ({ ...b, value: counts[i] > 0 ? sums[i] / counts[i] : null }));
}

function fillCounterRateBuckets(scores: WhsScore[], buckets: TrendBucket[], unit: 'day' | 'week') {
  const counters = new Array(buckets.length).fill(0);
  const totals = new Array(buckets.length).fill(0);
  for (const s of scores) {
    const idx = bucketIndexFor(new Date(s.play_date), buckets, unit);
    if (idx < 0) continue;
    totals[idx] += 1;
    if (s.is_counter) counters[idx] += 1;
  }
  return buckets.map((b, i) => ({
    ...b,
    value: totals[i] > 0 ? (counters[i] / totals[i]) * 100 : null,
  }));
}

function computeTypicalRange(values: number[]): { low: number | null; high: number | null } {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length < 4) return { low: null, high: null };
  const q1Idx = Math.floor(sorted.length * 0.25);
  const q3Idx = Math.floor(sorted.length * 0.75);
  return { low: sorted[q1Idx], high: sorted[q3Idx] };
}

interface InsightInput {
  metricLabel: string;
  current: number | null;
  typicalLow: number | null;
  typicalHigh: number | null;
  betterDirection: 'down' | 'up';
}

function generateInsight({
  metricLabel,
  current,
  typicalLow,
  typicalHigh,
  betterDirection,
}: InsightInput): string {
  if (current === null) {
    return `Not enough recent rounds to compute a ${metricLabel.toLowerCase()} trend.`;
  }
  if (typicalLow === null || typicalHigh === null) {
    return `Need a few more rounds to establish your typical range.`;
  }
  if (current < typicalLow) {
    return betterDirection === 'down'
      ? `Your ${metricLabel.toLowerCase()} is below your typical range — promising form.`
      : `Your ${metricLabel.toLowerCase()} is below your typical range — worth watching.`;
  }
  if (current > typicalHigh) {
    return betterDirection === 'up'
      ? `Your ${metricLabel.toLowerCase()} is above your typical range — strong period.`
      : `Your ${metricLabel.toLowerCase()} is above your typical range — work to do.`;
  }
  return `Your ${metricLabel.toLowerCase()} is sitting in your typical range.`;
}

function computePerWeekCounterRates(scores: WhsScore[]): number[] {
  if (scores.length === 0) return [];
  const today = startOfDay(new Date());
  const buckets = Array.from({ length: 13 }, (_, i) => ({
    start: subWeeks(today, 12 - i),
    counters: 0,
    total: 0,
  }));
  for (const s of scores) {
    const d = new Date(s.play_date);
    const days = differenceInDays(d, buckets[0].start);
    const idx = Math.floor(days / 7);
    if (idx < 0 || idx >= buckets.length) continue;
    buckets[idx].total += 1;
    if (s.is_counter) buckets[idx].counters += 1;
  }
  return buckets.filter((b) => b.total > 0).map((b) => (b.counters / b.total) * 100);
}

const METRIC_META: Record<
  'diff' | 'stableford' | 'counter_rate',
  {
    label: string;
    sublabel: string;
    icon: typeof TrendingDown;
    decimals: 0 | 1 | 2;
    unit: string;
    betterDirection: 'down' | 'up';
  }
> = {
  diff: {
    label: 'Avg Differential',
    sublabel: 'Per round',
    icon: TrendingDown,
    decimals: 1,
    unit: '',
    betterDirection: 'down',
  },
  stableford: {
    label: 'Stableford',
    sublabel: 'Per round',
    icon: Target,
    decimals: 1,
    unit: ' pts',
    betterDirection: 'up',
  },
  counter_rate: {
    label: 'Counter Rate',
    sublabel: '% of rounds counting',
    icon: Flag,
    decimals: 0,
    unit: '%',
    betterDirection: 'up',
  },
};

export function computeMetric(
  metricId: 'diff' | 'stableford' | 'counter_rate',
  range: TrendRange,
  scores: WhsScore[],
): TrendMetric {
  const { unit } = getBucketSpec(range);
  let buckets = emptyBuckets(range);

  switch (metricId) {
    case 'diff':
      buckets = fillDiffBuckets(scores, buckets, unit);
      break;
    case 'stableford':
      buckets = fillStablefordBuckets(scores, buckets, unit);
      break;
    case 'counter_rate':
      buckets = fillCounterRateBuckets(scores, buckets, unit);
      break;
  }

  const lastNonNull = [...buckets].reverse().find((b) => b.value !== null);
  const currentValue = lastNonNull?.value ?? null;

  const lastIdx = lastNonNull ? buckets.indexOf(lastNonNull) : -1;
  const prevBucket =
    lastIdx > 0
      ? [...buckets].slice(0, lastIdx).reverse().find((b) => b.value !== null)
      : null;
  const previousPeriodDelta =
    currentValue !== null && prevBucket?.value !== null && prevBucket?.value !== undefined
      ? currentValue - prevBucket.value
      : null;

  const ninetyDaysAgo = subDays(new Date(), 90);
  const ninetyDayScores = scores.filter((s) => isAfter(new Date(s.play_date), ninetyDaysAgo));
  let typicalValues: number[] = [];
  switch (metricId) {
    case 'diff':
      typicalValues = ninetyDayScores
        .map((s) => s.handicap_differential)
        .filter((v): v is number => v !== null);
      break;
    case 'stableford':
      typicalValues = ninetyDayScores
        .map((s) => s.stableford_points)
        .filter((v): v is number => v !== null);
      break;
    case 'counter_rate':
      typicalValues = computePerWeekCounterRates(ninetyDayScores);
      break;
  }
  const { low: typicalRangeLow, high: typicalRangeHigh } = computeTypicalRange(typicalValues);

  const meta = METRIC_META[metricId];

  return {
    id: metricId,
    label: meta.label,
    sublabel: meta.sublabel,
    icon: meta.icon,
    currentValue,
    decimals: meta.decimals,
    unit: meta.unit,
    previousPeriodDelta,
    betterDirection: meta.betterDirection,
    typicalRangeLow,
    typicalRangeHigh,
    buckets,
    insight: generateInsight({
      metricLabel: meta.label,
      current: currentValue,
      typicalLow: typicalRangeLow,
      typicalHigh: typicalRangeHigh,
      betterDirection: meta.betterDirection,
    }),
  };
}
