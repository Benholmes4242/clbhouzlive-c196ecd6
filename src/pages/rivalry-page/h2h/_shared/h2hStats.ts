/**
 * h2hStats — definitions, formatting and derivation for the head-to-head
 * stat rows. Pure (data in, data out).
 */
import {
  Activity,
  Award,
  Bird,
  Crown,
  Feather,
  Globe,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type H2HStatFormat =
  | 'count'
  | 'low_better'
  | 'high_better'
  | 'delta_low_better'
  | 'hot_flag';

export interface H2HStatDef {
  key: keyof PlayerStats | 'h2h_best_margin';
  label: string;
  icon: LucideIcon;
  format: H2HStatFormat;
  decimals?: number;
  isH2H?: boolean;
}

export interface PlayerStats {
  // Lifetime
  birdies: number;
  eagles: number;
  albatrosses: number;
  aces: number;
  sub80_rounds: number;
  sub_par_rounds: number;
  top100_played: number;
  rounds_played: number;
  // Personal bests
  lowest_gross: number | null;
  best_stableford: number | null;
  lowest_net: number | null;
  // Current form
  handicap_index: number | null;
  delta90: number | null;
  last5_avg_vs_par: number | null;
  is_hot: boolean;
}

export interface HeadToHeadStats {
  me: PlayerStats;
  them: PlayerStats;
  meBestMargin: number | null;
  themBestMargin: number | null;
  rivalName: string;
}

export const LIFETIME_STATS: H2HStatDef[] = [
  { key: 'birdies', label: 'Birdies', icon: Feather, format: 'count' },
  { key: 'eagles', label: 'Eagles', icon: Bird, format: 'count' },
  { key: 'albatrosses', label: 'Albatrosses', icon: Sparkles, format: 'count' },
  { key: 'aces', label: 'Aces', icon: Target, format: 'count' },
  { key: 'sub80_rounds', label: 'Sub-80 rounds', icon: TrendingDown, format: 'count' },
  { key: 'sub_par_rounds', label: 'Sub-par rounds', icon: Activity, format: 'count' },
  { key: 'top100_played', label: 'World Top 100 played', icon: Globe, format: 'count' },
  { key: 'rounds_played', label: 'Rounds played', icon: Activity, format: 'count' },
];

export const PERSONAL_BESTS: H2HStatDef[] = [
  { key: 'lowest_gross', label: 'Lowest gross', icon: TrendingDown, format: 'low_better' },
  { key: 'best_stableford', label: 'Best stableford', icon: Award, format: 'high_better' },
  { key: 'h2h_best_margin', label: 'Best margin (vs them)', icon: Crown, format: 'high_better', isH2H: true },
  { key: 'lowest_net', label: 'Lowest 18-hole net', icon: Shield, format: 'low_better' },
];

export const CURRENT_FORM: H2HStatDef[] = [
  { key: 'handicap_index', label: 'Handicap index', icon: TrendingDown, format: 'low_better', decimals: 1 },
  { key: 'delta90', label: '90D delta', icon: Activity, format: 'delta_low_better', decimals: 1 },
  { key: 'last5_avg_vs_par', label: 'Last 5 avg vs par', icon: Activity, format: 'low_better', decimals: 1 },
  { key: 'is_hot', label: 'Form rating', icon: Zap, format: 'hot_flag' },
];

export const ALL_STAT_DEFS: H2HStatDef[] = [
  ...LIFETIME_STATS,
  ...PERSONAL_BESTS,
  ...CURRENT_FORM,
];

/** Extract the comparable value for a stat from a side's data. */
export function valueFor(
  stat: H2HStatDef,
  player: PlayerStats,
  bestMargin: number | null,
): unknown {
  if (stat.key === 'h2h_best_margin') return bestMargin;
  if (stat.format === 'hot_flag') return player.is_hot ? 'HOT' : 'STEADY';
  return (player as unknown as Record<string, unknown>)[stat.key];
}

/** Render a value for display. */
export function formatValue(stat: H2HStatDef, raw: unknown): string {
  if (stat.format === 'hot_flag') {
    return raw === 'HOT' ? 'HOT' : 'STEADY';
  }
  if (raw == null || raw === '') return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '—';
  if (stat.decimals != null) {
    const sign =
      stat.format === 'delta_low_better' && n > 0 ? '+' : '';
    return `${sign}${n.toFixed(stat.decimals)}`;
  }
  return String(Math.round(n));
}
