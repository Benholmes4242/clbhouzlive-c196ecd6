/**
 * Post Helper Functions
 * 
 * Single source of truth for post type detection and helper utilities.
 */

import { getRatingTheme, type RatingTheme, COURSE_RATING_THEMES } from './globalAchievementMilestoneSystem';
import { getScoreTier } from '@/utils/getScoreTier';

/**
 * Determines if a post is a review post.
 * Single source of truth for review detection across the app.
 * 
 * @example
 * if (isReviewPost(post)) {
 *   // Render review-specific overlay
 * }
 */
export const isReviewPost = (post: any): boolean => {
  if (!post) return false;
  
  return (
    post.isReview === true ||
    (Array.isArray(post.categories) && post.categories.includes('review')) ||
    !!post.source_review_id ||
    !!post.sourceReviewId
  );
};

/**
 * Extended review theme for overlay usage with additional styling properties.
 */
export interface ReviewOverlayTheme extends RatingTheme {
  // Pill-specific colors for dark backgrounds (overlays)
  pillBg: string;
  pillBorder: string;
  pillText: string;
  // Container colors
  containerBg: string;
  containerBorder: string;
  // Text colors for overlays
  overlayText: string;
}

// Slate theme for non-outstanding ratings (on dark backgrounds)
const slateOverlayTheme: Omit<ReviewOverlayTheme, keyof RatingTheme> = {
  pillBg: 'rgba(100, 116, 139, 0.12)',
  pillBorder: 'rgba(100, 116, 139, 0.45)',
  pillText: '#CBD5E1', // slate-300 - light text on dark
  containerBg: 'rgba(0, 0, 0, 0.5)',
  containerBorder: 'rgba(255, 255, 255, 0.1)',
  overlayText: '#FFFFFF',
};

// Gold theme for outstanding ratings (on dark backgrounds)
const goldOverlayTheme: Omit<ReviewOverlayTheme, keyof RatingTheme> = {
  pillBg: 'rgba(210, 180, 97, 0.15)',
  pillBorder: 'rgba(210, 180, 97, 0.5)',
  pillText: '#D2B461', // gold accent
  containerBg: 'rgba(0, 0, 0, 0.5)',
  containerBorder: 'rgba(210, 180, 97, 0.3)',
  overlayText: '#FFFFFF',
};

/**
 * Get review overlay theme for a rating score.
 * Uses Gold for Outstanding (9.0+), Slate for all others.
 * Optimized for dark overlay backgrounds (Clubhouse, preview screens).
 * 
 * @param score - Rating score (0-10)
 * @returns Complete theme with overlay-specific colors
 */
export function getReviewOverlayTheme(score: number): ReviewOverlayTheme {
  const baseTheme = getRatingTheme(score);
  const isOutstanding = score >= 9.0;
  
  return {
    ...baseTheme,
    ...(isOutstanding ? goldOverlayTheme : slateOverlayTheme),
  };
}

/**
 * Get review overlay theme by tier label.
 * 
 * @param tierLabel - Tier label string (e.g., 'OUTSTANDING', 'EXCELLENT')
 * @returns Complete theme with overlay-specific colors
 */
export function getReviewOverlayThemeByLabel(tierLabel: string): ReviewOverlayTheme {
  const isOutstanding = tierLabel.toUpperCase() === 'OUTSTANDING';
  const baseTheme = isOutstanding 
    ? COURSE_RATING_THEMES.OUTSTANDING 
    : COURSE_RATING_THEMES.EXCELLENT; // Default to slate for non-outstanding
  
  return {
    ...baseTheme,
    ...(isOutstanding ? goldOverlayTheme : slateOverlayTheme),
  };
}

/**
 * Extract review data from a post for use in review-mode components.
 * Returns null if the post is not a review post.
 */
export interface ExtractedReviewData {
  courseId: string;
  courseName: string;
  courseLocation?: string;
  rating: number;
  tierLabel: string;
  sourceReviewId: string;
}

export function extractReviewData(post: any): ExtractedReviewData | null {
  if (!isReviewPost(post)) return null;
  
  const rating = post.reviewRating ?? post.rating ?? 0;
  const tierData = getScoreTier(rating);
  
  return {
    courseId: post.course_id || post.courseId || post.golfCourse?.id || '',
    courseName: post.courseName || post.golfCourse?.name || 'Golf Course',
    courseLocation: post.courseLocation || 
      (post.golfCourse 
        ? `${post.golfCourse.region || ''}, ${post.golfCourse.country || ''}`.replace(/^, |, $/g, '')
        : undefined
      ),
    rating,
    tierLabel: tierData?.label || 'FAIR',
    sourceReviewId: post.source_review_id || post.sourceReviewId || '',
  };
}
