import {
  Trophy,
  Feather,
  Target,
  TrendingDown,
  Award,
  Sparkles,
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

/**
 * Display labels for legend categories. 90D and all-time variants share
 * the same display name — the time window is implied by section context,
 * not card-level metadata.
 */
export const legendCategoryLabel: Record<LegendCategory, string> = {
  lowest_gross_90d:         'Gross Record',
  lowest_gross_all_time:    'Gross Record',
  best_score_diff_90d:      'Score Legend',
  best_score_diff_all_time: 'Score Legend',
  most_birdies_90d:         'Birdies',
  most_birdies_all_time:    'Birdies',
  best_stableford_90d:      'Leading Stableford',
  best_stableford_all_time: 'Leading Stableford',
  most_eagles_90d:          'Eagles',
  most_eagles_all_time:     'Eagles',
  most_aces_90d:            'Aces',
  most_aces_all_time:       'Aces',
};


/**
 * Lucide icon component per legend category. Canonical source of truth
 * for all gam surfaces.
 */
export const legendCategoryIcon: Record<LegendCategory, LucideIcon> = {
  lowest_gross_90d:         Trophy,
  lowest_gross_all_time:    Trophy,
  best_score_diff_90d:      TrendingDown,
  best_score_diff_all_time: TrendingDown,
  most_birdies_90d:         Feather,
  most_birdies_all_time:    Feather,
  best_stableford_90d:      Target,
  best_stableford_all_time: Target,
  most_eagles_90d:          Award,
  most_eagles_all_time:     Award,
  most_aces_90d:            Sparkles,
  most_aces_all_time:       Sparkles,
};

/**
 * Whether a category represents a rolling 90-day or permanent all-time record.
 * Used by the section toggle to filter visible categories.
 */
export const legendCategoryWindow: Record<LegendCategory, '90d' | 'all_time'> = {
  lowest_gross_90d:         '90d',
  lowest_gross_all_time:    'all_time',
  best_score_diff_90d:      '90d',
  best_score_diff_all_time: 'all_time',
  most_birdies_90d:         '90d',
  most_birdies_all_time:    'all_time',
  best_stableford_90d:      '90d',
  best_stableford_all_time: 'all_time',
  most_eagles_90d:          '90d',
  most_eagles_all_time:     'all_time',
  most_aces_90d:            '90d',
  most_aces_all_time:       'all_time',
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
    case 'best_score_diff_90d':
    case 'best_score_diff_all_time':
      return value < 0 ? `${value.toFixed(1)} vs hcp` : `+${value.toFixed(1)} vs hcp`;
    case 'most_birdies_90d':
    case 'most_birdies_all_time':
      return `${value} birdies`;
    case 'lowest_gross_90d':
    case 'lowest_gross_all_time':
      return `${value}`;
    case 'best_stableford_90d':
    case 'best_stableford_all_time':
      return `${value} pts`;
    case 'most_eagles_90d':
    case 'most_eagles_all_time':
      return `${value} eagle${value === 1 ? '' : 's'}`;
    case 'most_aces_90d':
    case 'most_aces_all_time':
      return `${value} ace${value === 1 ? '' : 's'}`;
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
  if (category === 'best_score_diff_90d' || category === 'best_score_diff_all_time') {
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
    case 'best_score_diff_90d':
    case 'best_score_diff_all_time':
      return `${abs.toFixed(1)} vs hcp`;
    case 'lowest_gross_90d':
    case 'lowest_gross_all_time': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'stroke' : 'strokes'}`;
    }
    case 'most_birdies_90d':
    case 'most_birdies_all_time': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'birdie' : 'birdies'}`;
    }
    case 'best_stableford_90d':
    case 'best_stableford_all_time': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'pt' : 'pts'}`;
    }

    case 'most_eagles_90d':
    case 'most_eagles_all_time': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'eagle' : 'eagles'}`;
    }
    case 'most_aces_90d':
    case 'most_aces_all_time': {
      const n = Math.round(abs);
      return `${n} ${n === 1 ? 'ace' : 'aces'}`;
    }
  }
}
