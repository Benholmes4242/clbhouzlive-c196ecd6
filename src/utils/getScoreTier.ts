/**
 * Score Tier Utility
 * 
 * NEW COLOR SYSTEM (Jan 2026):
 * - Fair → Excellent: All use gray styling
 * - Outstanding / Exceptional: Both use amber/orange (gold tier) styling
 * 
 * Outstanding (9.0–9.4) and Exceptional (≥9.5) share identical amber visual
 * treatment per the unified gold-tier decision. The `isOutstanding` flag and
 * `isGoldTier` helper both return true for either tier — use them anywhere
 * a "should this render gold?" check is needed.
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
  isOutstanding: boolean;
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
 * All tiers currently use unified amber styling per the all-amber decision.
 */
export function getScoreTier(score: number): ScoreTierData {
  const theme = getRatingTheme(score);
  const tier = tierKeyMap[theme.key];
  // isOutstanding is the legacy "render gold?" flag — under the 5-tier
  // system only EXCEPTIONAL qualifies. Field name retained for back-compat.
  const isOutstanding = theme.key === 'EXCEPTIONAL';
  
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
    isOutstanding,
  };
}

/**
 * Get raw theme from global system for direct access
 */
export function getScoreTierTheme(score: number): RatingTheme {
  return getRatingTheme(score);
}
