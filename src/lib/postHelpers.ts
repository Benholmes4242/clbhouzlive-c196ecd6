/**
 * Post Helper Functions
 * 
 * Single source of truth for post type detection and helper utilities.
 */

import { getRatingTheme, type RatingTheme, COURSE_RATING_THEMES } from './globalAchievementMilestoneSystem';
import { getScoreTier } from '@/utils/getScoreTier';

/**
 * Determines if a post is a review post (created via Review Wizard with rating).
 * Single source of truth for review detection across the app.
 * 
 * IMPORTANT: This only returns true for actual review posts created via the Review Wizard,
 * NOT for regular posts that happen to have the "review" category selected.
 * 
 * A post is a review if:
 * - It has isReview === true (explicitly marked as review)
 * - It has source_review_id/sourceReviewId (linked to a course_rating)
 * 
 * A post is NOT a review just because:
 * - It has categories containing 'review' (this is just a content category tag)
 * 
 * @example
 * if (isReviewPost(post)) {
 *   // Render review-specific overlay with rating
 * }
 */
export const isReviewPost = (post: any): boolean => {
  if (!post) return false;
  
  // Only actual review posts - NOT posts with "review" category
  // Review posts are created via Review Wizard and have source_review_id
  return (
    post.isReview === true ||
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

// Per-tier overlay themes for dark backgrounds
// Maps course-detail tier palette to overlay-safe colors (light-on-dark)
// Outstanding: Amber (#f59e0b), then graduated slate scale for visibility on glass
const tierOverlayThemes: Record<string, Omit<ReviewOverlayTheme, keyof RatingTheme>> = {
  outstanding: {
    pillBg: 'rgba(245, 158, 11, 0.15)',
    pillBorder: 'rgba(245, 158, 11, 0.5)',
    pillText: '#f59e0b',
    containerBg: 'rgba(245, 158, 11, 0.08)',
    containerBorder: 'rgba(245, 158, 11, 0.3)',
    overlayText: '#FFFFFF',
  },
  excellent: {
    pillBg: 'rgba(226, 232, 240, 0.15)',
    pillBorder: 'rgba(226, 232, 240, 0.45)',
    pillText: '#e2e8f0',                          // slate-200
    containerBg: 'rgba(0, 0, 0, 0.5)',
    containerBorder: 'rgba(255, 255, 255, 0.08)',
    overlayText: '#FFFFFF',
  },
  veryGood: {
    pillBg: 'rgba(203, 213, 225, 0.15)',
    pillBorder: 'rgba(203, 213, 225, 0.45)',
    pillText: '#cbd5e1',                          // slate-300
    containerBg: 'rgba(0, 0, 0, 0.5)',
    containerBorder: 'rgba(255, 255, 255, 0.08)',
    overlayText: '#FFFFFF',
  },
  good: {
    pillBg: 'rgba(148, 163, 184, 0.15)',
    pillBorder: 'rgba(148, 163, 184, 0.45)',
    pillText: '#94a3b8',                          // slate-400
    containerBg: 'rgba(0, 0, 0, 0.5)',
    containerBorder: 'rgba(255, 255, 255, 0.08)',
    overlayText: '#FFFFFF',
  },
  fair: {
    pillBg: 'rgba(100, 116, 139, 0.15)',
    pillBorder: 'rgba(100, 116, 139, 0.45)',
    pillText: '#64748b',                          // slate-500
    containerBg: 'rgba(0, 0, 0, 0.5)',
    containerBorder: 'rgba(255, 255, 255, 0.08)',
    overlayText: '#FFFFFF',
  },
};

function getTierKey(score: number): string {
  if (score >= 9) return 'outstanding';
  if (score >= 8) return 'excellent';
  if (score >= 7) return 'veryGood';
  if (score >= 6) return 'good';
  return 'fair';
}

/**
 * Get overlay-safe rating colors for a score.
 * Returns per-tier colors adapted for dark glass backgrounds.
 * Matches course-detail tier palette: Outstanding (amber), Excellent→Fair (graduated slate).
 */
export function getOverlayRatingColors(score: number): { main: string; sub: string } {
  if (score >= 9) return { main: '#f59e0b', sub: 'rgba(245, 158, 11, 0.6)' };
  if (score >= 8) return { main: '#e2e8f0', sub: 'rgba(226, 232, 240, 0.6)' };
  if (score >= 7) return { main: '#cbd5e1', sub: 'rgba(203, 213, 225, 0.6)' };
  if (score >= 6) return { main: '#94a3b8', sub: 'rgba(148, 163, 184, 0.6)' };
  return { main: '#64748b', sub: 'rgba(100, 116, 139, 0.6)' };
}

/**
 * Get review overlay theme for a rating score.
 * Uses per-tier colors matching the course detail page palette,
 * adapted for dark overlay backgrounds (Clubhouse, preview screens).
 * 
 * @param score - Rating score (0-10)
 * @returns Complete theme with overlay-specific colors
 */
export function getReviewOverlayTheme(score: number): ReviewOverlayTheme {
  const baseTheme = getRatingTheme(score);
  const key = getTierKey(score);
  
  return {
    ...baseTheme,
    ...tierOverlayThemes[key],
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
    : COURSE_RATING_THEMES.EXCELLENT; // Default to gray for non-outstanding
  
  return {
    ...baseTheme,
    ...(isOutstanding ? amberOverlayTheme : grayOverlayTheme),
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
  
  // Handle location - use format: Country, Region (e.g., "USA, Georgia" or "England, Surrey")
  let courseLocation: string | undefined;
  const region = course.region || '';
  const country = course.country || '';
  
  if (country && region && country !== region) {
    courseLocation = `${country}, ${region}`;
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
