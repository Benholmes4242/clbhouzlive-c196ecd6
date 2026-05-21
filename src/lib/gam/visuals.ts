import {
  Trophy,
  Feather,
  MapPin,
  Target,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeRarity, LegendCategory, StreakType } from './types';

export const rarityColor: Record<BadgeRarity, string> = {
  common: 'rgba(148, 163, 184, 0.6)',
  uncommon: '#3B82F6',
  rare: '#F7931E',
  epic: '#A855F7',
  legendary: '#FBBC2E',
};

export const rarityColorSoft: Record<BadgeRarity, string> = {
  common: 'rgba(148, 163, 184, 0.12)',
  uncommon: 'rgba(59, 130, 246, 0.12)',
  rare: 'rgba(247, 147, 30, 0.10)',
  epic: 'rgba(168, 85, 247, 0.12)',
  legendary: 'rgba(251, 188, 46, 0.14)',
};

export const legendCategoryLabel: Record<LegendCategory, string> = {
  best_score_diff: 'Score Legend',
  most_birdies_90d: 'Birdie Legend',
  most_rounds_90d: 'Visitor Legend',
  lowest_gross: 'Gross Record',
  best_stableford_90d: 'Stableford Champ',
};

export const legendCategoryEmoji: Record<LegendCategory, string> = {
  best_score_diff: '🏆',
  most_birdies_90d: '🟠',
  most_rounds_90d: '📍',
  lowest_gross: '🥏',
  best_stableford_90d: '⛳',
};

/**
 * Lucide icon component per legend category. Use this for new dark-mode
 * surfaces (CourseLegendsCard, LegendPulseTicker). The emoji map above is
 * retained for back-compat with LegendsView drilldown, LegendStatusCard
 * (Today tab), and LegendStatusSheet — migrate those in a follow-up PR.
 */
export const legendCategoryIcon: Record<LegendCategory, LucideIcon> = {
  best_score_diff: TrendingDown,
  most_birdies_90d: Feather,
  most_rounds_90d: MapPin,
  lowest_gross: Trophy,
  best_stableford_90d: Target,
};

export const streakLabel: Record<StreakType, string> = {
  round_played: 'Round Streak',
  no_up: 'No-Up Streak',
  cutting: 'Cutting Streak',
  counter: 'Counter Streak',
  sub_par: 'Sub-Par Streak',
  sub_80: 'Sub-80 Streak',
  birdie_round: 'Birdie-Round Streak',
};

export function formatLegendValue(category: LegendCategory, value: number): string {
  switch (category) {
    case 'best_score_diff':
      return value < 0 ? `${value.toFixed(1)} vs hcp` : `+${value.toFixed(1)} vs hcp`;
    case 'most_birdies_90d':
      return `${value} birdies`;
    case 'most_rounds_90d':
      return `${value} rounds`;
    case 'lowest_gross':
      return `${value}`;
    case 'best_stableford_90d':
      return `${value} pts`;
  }
}

export function rankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.floor(diffMo / 12)}y ago`;
}


const MINUS = '\u2212'; // Unicode minus sign (not ASCII hyphen)

/**
 * Format a legend value for inline display (e.g. in CourseLegendsCard
 * holder cells). Returns the bare number; the unit is implied by the
 * category label rendered above. Score is the only category with a sign.
 */
export function formatLegendValueCompact(
  category: LegendCategory,
  value: number,
): string {
  if (category === 'best_score_diff') {
    if (value < 0) return `${MINUS}${Math.abs(value).toFixed(1)}`;
    return `+${value.toFixed(1)}`;
  }
  return String(Math.round(value));
}

/**
 * Format a gap-to-first value for pulse "chase" cards.
 * Returns e.g. "2 strokes", "1 birdie", "0.4 vs hcp".
 */
export function formatLegendGap(category: LegendCategory, gap: number): string {
  const abs = Math.abs(gap);
  switch (category) {
    case 'best_score_diff':
      return `${abs.toFixed(1)} vs hcp`;
    case 'lowest_gross': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'stroke' : 'strokes'}`;
    }
    case 'most_birdies_90d': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'birdie' : 'birdies'}`;
    }
    case 'most_rounds_90d': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'round' : 'rounds'}`;
    }
    case 'best_stableford_90d':
      return `${Math.round(abs)} pts`;
  }
}
