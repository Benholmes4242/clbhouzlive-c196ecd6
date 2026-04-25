/**
 * Score Tier Utility
 * 
 * 5-TIER SYSTEM (Apr 2026):
 * - Exceptional (≥9.0): Amber/orange (gold tier) styling — the only gold tier
 * - Excellent (7.5-8.9), Good (6.0-7.4), Fair (4.0-5.9), Poor (<4.0): gray styling
 * 
 * The `isExceptional` flag and `isGoldTier` helper both return true ONLY for
 * Exceptional — use them anywhere a "should this render gold?" check is needed.
 * 
 * All rating colors come from COURSE_RATING_THEMES.
 */

import { getRatingTheme, type RatingTheme } from '@/lib/globalAchievementMilestoneSystem';

export type ScoreTier = 'exceptional' | 'excellent' | 'good' | 'fair' | 'poor';

export interface ScoreTierData {
  tier: ScoreTier;
  label: string;
  bg: string;
  border: string;
  text: string;
  barFill: string;
  accent: string;
  bgLight: string;
  bgDark: string;
  isExceptional: boolean;
}

// Map RatingTheme key to ScoreTier
const tierKeyMap: Record<string, ScoreTier> = {
  'EXCEPTIONAL': 'exceptional',
  'EXCELLENT': 'excellent',
  'GOOD': 'good',
  'FAIR': 'fair',
  'POOR': 'poor',
};

/**
 * Returns true if the given tier should render with gold (amber) styling.
 * Only Exceptional (≥9.0) qualifies under the 5-tier system.
 */
export const isGoldTier = (tier: ScoreTier | undefined): boolean =>
  tier === 'exceptional';

/**
 * Get the score tier data for a given rating score.
 * Only Exceptional renders with amber styling; all others use gray.
 */
export function getScoreTier(score: number): ScoreTierData {
  const theme = getRatingTheme(score);
  const tier = tierKeyMap[theme.key];
  // True only for the Exceptional tier (≥9.0) — the sole gold tier.
  const isExceptional = theme.key === 'EXCEPTIONAL';
  
  return {
    tier,
    label: theme.label,
    bg: theme.bgClass,
    border: theme.borderClass,
    text: theme.textClass,
    barFill: theme.barFillClass,
    accent: theme.accent,
    bgLight: theme.bgLight,
    bgDark: theme.bgDark,
    isExceptional,
  };
}

/**
 * Get raw theme from global system for direct access
 */
export function getScoreTierTheme(score: number): RatingTheme {
  return getRatingTheme(score);
}
