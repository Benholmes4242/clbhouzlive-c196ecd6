import type { LucideIcon } from 'lucide-react';

export type TrendRange = '7d' | '1m' | '6m';

export interface TrendBucket {
  label: string;
  date: Date;
  value: number | null;
}

export interface TrendMetric {
  id: 'diff' | 'stableford' | 'counter_rate';
  label: string;
  sublabel: string;
  icon: LucideIcon;
  currentValue: number | null;
  decimals: 0 | 1 | 2;
  unit: string;
  previousPeriodDelta: number | null;
  betterDirection: 'down' | 'up';
  typicalRangeLow: number | null;
  typicalRangeHigh: number | null;
  buckets: TrendBucket[];
  insight: string;
}
