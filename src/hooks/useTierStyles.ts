import { courseDetailTokens, TierKey } from '@/styles/course-detail-tokens';

/**
 * Get tier styles based on a numeric score (0-10 scale)
 * NEW: Gray for Fair→Excellent, Amber for Outstanding
 */
export const useTierStyles = (score: number) => {
  if (score >= 9) return courseDetailTokens.tiers.outstanding;
  if (score >= 8) return courseDetailTokens.tiers.excellent;
  if (score >= 7) return courseDetailTokens.tiers.veryGood;
  if (score >= 6) return courseDetailTokens.tiers.good;
  return courseDetailTokens.tiers.fair;
};

/**
 * Get tier key from score (useful for dynamic class building)
 */
export const getTierKeyFromScore = (score: number): TierKey => {
  if (score >= 9) return 'outstanding';
  if (score >= 8) return 'excellent';
  if (score >= 7) return 'veryGood';
  if (score >= 6) return 'good';
  return 'fair';
};

/**
 * Get tier styles from a label string
 */
export const getTierFromLabel = (label: string) => {
  const map: Record<string, TierKey> = {
    'Outstanding': 'outstanding',
    'Excellent': 'excellent',
    'Very Good': 'veryGood',
    'Good': 'good',
    'Fair': 'fair',
  };
  return courseDetailTokens.tiers[map[label] || 'good'];
};

/**
 * Get tier label from score
 */
export const getTierLabel = (score: number): string => {
  if (score >= 9) return 'Outstanding';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Very Good';
  if (score >= 6) return 'Good';
  return 'Fair';
};

/**
 * Get score ring gradient colors for SVG
 * NEW: Amber gradient for Outstanding, Gray for rest
 */
export const getScoreRingColors = (score: number) => {
  const key = getTierKeyFromScore(score);
  return courseDetailTokens.scoreRing[key];
};
