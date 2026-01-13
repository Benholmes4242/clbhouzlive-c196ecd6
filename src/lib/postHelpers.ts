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
// Must match CreatorCapsule exactly: bg-black/50, border-white/8
const slateOverlayTheme: Omit<ReviewOverlayTheme, keyof RatingTheme> = {
  pillBg: 'rgba(100, 116, 139, 0.12)',
  pillBorder: 'rgba(100, 116, 139, 0.45)',
  pillText: '#CBD5E1', // slate-300 - light text on dark
  containerBg: 'rgba(0, 0, 0, 0.5)', // black/50 - matches CreatorCapsule
  containerBorder: 'rgba(255, 255, 255, 0.08)', // white/8 - matches CreatorCapsule
  overlayText: '#FFFFFF',
};

// Amber gradient theme for outstanding ratings (on dark backgrounds)
// Uses Tailwind amber-400 → amber-500 (#fbbf24 → #f59e0b)
const goldOverlayTheme: Omit<ReviewOverlayTheme, keyof RatingTheme> = {
  pillBg: 'rgba(251, 191, 36, 0.15)',           // amber-400 with 15% opacity
  pillBorder: 'rgba(245, 158, 11, 0.5)',        // amber-500 with 50% opacity
  pillText: '#f59e0b',                           // amber-500
  containerBg: 'rgba(251, 191, 36, 0.08)',      // amber-400 with 8% opacity
  containerBorder: 'rgba(251, 191, 36, 0.3)',   // amber-400 with 30% opacity
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
 * 
 * SINGLE SOURCE OF TRUTH for review data extraction.
 * Use this everywhere: Clubhouse, Profile Activity, Preview.
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
  
  // Handle rating from multiple possible fields
  const rating = post.reviewRating ?? post.rating ?? 0;
  const tierData = getScoreTier(rating);
  
  // Handle course data from multiple possible locations
  const course = post.course || post.golfCourse || {};
  const courseId = post.course_id || post.courseId || course.id || '';
  const courseName = post.courseName || course.name || 'Golf Course';
  
  // Handle location - use SHORT format (region, country) consistently
  let courseLocation: string | undefined;
  const region = course.region || '';
  const country = course.country || '';
  
  if (region && country && region !== country) {
    courseLocation = `${region}, ${country}`;
  } else {
    courseLocation = country || region || undefined;
  }
  
  // Handle source review ID from multiple possible fields
  const sourceReviewId = post.source_review_id || post.sourceReviewId || post.id || '';
  
  return {
    courseId,
    courseName,
    courseLocation,
    rating,
    tierLabel: tierData?.label || 'FAIR',
    sourceReviewId,
  };
}

/**
 * Extract user data from post object, handling field name variations.
 * Supports both 'user' and 'actor' parent objects.
 * 
 * SINGLE SOURCE OF TRUTH for user data extraction.
 * Use this everywhere for consistent user display.
 */
export interface ExtractedUserData {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export function extractUserData(post: any): ExtractedUserData {
  const user = post.user || post.actor || {};
  
  return {
    id: user.id || post.created_by || post.user_id || '',
    name: user.display_name || user.name || user.username || 'Golfer',
    username: user.username,
    avatar: user.profile_photo_url || user.avatar_url || user.avatar,
  };
}
