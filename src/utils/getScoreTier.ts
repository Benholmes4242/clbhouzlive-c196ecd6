/**
 * Score Tier Utility
 * 
 * IMPORTANT: This file uses the Masters Green Ladder from globalAchievementMilestoneSystem.ts
 * All rating colors come from COURSE_RATING_THEMES - do not define colors locally.
 */

import { getRatingTheme, type RatingTheme } from '@/lib/globalAchievementMilestoneSystem';

export type ScoreTier = 'outstanding' | 'excellent' | 'veryGood' | 'good' | 'fair';

export interface ScoreTierData {
  tier: ScoreTier;
  label: string;
  bg: string;
  border: string;
  text: string;
  barFill: string;
  // Raw hex values from Masters Green Ladder
  accent: string;
  bgLight: string;
  bgDark: string;
}

// Map RatingTheme key to ScoreTier
const tierKeyMap: Record<string, ScoreTier> = {
  'OUTSTANDING': 'outstanding',
  'EXCELLENT': 'excellent',
  'VERY_GOOD': 'veryGood',
  'GOOD': 'good',
  'FAIR': 'fair',
};

/**
 * Get the score tier data for a given rating score.
 * Returns consistent badge styling tokens used across Community Score and Review Cards.
 * 
 * All colors are sourced from the Masters Green Ladder (COURSE_RATING_THEMES).
 */
export function getScoreTier(score: number): ScoreTierData {
  const theme = getRatingTheme(score);
  const tier = tierKeyMap[theme.key];
  
  return {
    tier,
    label: theme.label,
    bg: `bg-[${theme.bgLight}]`,
    border: `border-[${theme.accent}]`,
    text: `text-[${theme.accent}]`,
    barFill: `bg-[${theme.accent}]`,
    // Raw values for direct style usage
    accent: theme.accent,
    bgLight: theme.bgLight,
    bgDark: theme.bgDark,
  };
}

/**
 * Get raw theme from global system for direct access
 */
export function getScoreTierTheme(score: number): RatingTheme {
  return getRatingTheme(score);
}
