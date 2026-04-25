/**
 * Score Tier Utility
 * 
 * NEW COLOR SYSTEM (Jan 2026):
 * - Fair → Excellent: All use gray styling
 * - Outstanding: Uses amber/orange styling
 * 
 * All rating colors come from COURSE_RATING_THEMES.
 */

import { getRatingTheme, type RatingTheme } from '@/lib/globalAchievementMilestoneSystem';

export type ScoreTier = 'exceptional' | 'outstanding' | 'excellent' | 'veryGood' | 'good' | 'fair';

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
  'OUTSTANDING': 'outstanding',
  'EXCELLENT': 'excellent',
  'VERY_GOOD': 'veryGood',
  'GOOD': 'good',
  'FAIR': 'fair',
};

/**
 * Get the score tier data for a given rating score.
 * Returns consistent styling tokens - gray for Fair→Excellent, amber for Outstanding.
 */
export function getScoreTier(score: number): ScoreTierData {
  const theme = getRatingTheme(score);
  const tier = tierKeyMap[theme.key];
  const isOutstanding = theme.key === 'OUTSTANDING';
  
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
