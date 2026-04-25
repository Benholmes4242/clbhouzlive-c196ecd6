/**
 * Post Helper Functions
 * 
 * Single source of truth for post type detection and helper utilities.
 */

import { getRatingTheme, type RatingTheme, COURSE_RATING_THEMES } from './globalAchievementMilestoneSystem';
import { getScoreTier } from '@/utils/getScoreTier';
import { getRatingTier, type RatingTier } from '@/lib/ratingTier';

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
// Exceptional: Amber (#f59e0b), then graduated slate scale for visibility on glass
// All tiers now use the same amber overlay theme (unified rating system)
const amberOverlay: Omit<ReviewOverlayTheme, keyof RatingTheme> = {
  pillBg: 'rgba(245, 158, 11, 0.15)',
  pillBorder: 'rgba(245, 158, 11, 0.5)',
  pillText: '#f59e0b',
  containerBg: 'rgba(245, 158, 11, 0.08)',
  containerBorder: 'rgba(245, 158, 11, 0.3)',
  overlayText: '#FFFFFF',
};

const tierOverlayThemes = {
  exceptional: amberOverlay,
  excellent: amberOverlay,
  good: amberOverlay,
  fair: amberOverlay,
  poor: amberOverlay,
} satisfies Record<string, Omit<ReviewOverlayTheme, keyof RatingTheme>>;

// Canonical tier → overlay key mapping. TypeScript exhaustiveness on
// Record<RatingTier, …> guarantees every canonical tier has an overlay row.
const RATING_TIER_TO_OVERLAY_KEY: Record<RatingTier, keyof typeof tierOverlayThemes> = {
  'EXCEPTIONAL': 'exceptional',
  'EXCELLENT': 'excellent',
  'GOOD': 'good',
  'FAIR': 'fair',
  'POOR': 'poor',
};

function getTierKey(score: number): keyof typeof tierOverlayThemes {
  return RATING_TIER_TO_OVERLAY_KEY[getRatingTier(score)];
}

/**
 * Get overlay-safe rating colors for a score.
 * Returns per-tier colors adapted for dark glass backgrounds.
 * Matches course-detail tier palette: Exceptional (amber), Excellent→Poor (graduated slate).
 */
export function getOverlayRatingColors(score: number): { main: string; sub: string } {
  // ALL tiers now use amber — consistent with course detail page
  return { main: '#f59e0b', sub: 'rgba(245,158,11,0.6)' };
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
 * @param tierLabel - Tier label string (e.g., 'EXCEPTIONAL', 'EXCELLENT')
 * @returns Complete theme with overlay-specific colors
 */
export function getReviewOverlayThemeByLabel(tierLabel: string): ReviewOverlayTheme {
  const labelToKey: Record<string, keyof typeof tierOverlayThemes> = {
    'EXCEPTIONAL': 'exceptional',
    'EXCELLENT': 'excellent',
    'GOOD': 'good',
    'FAIR': 'fair',
    'POOR': 'poor',
  };
  const key = labelToKey[tierLabel.toUpperCase()] || 'good';

  // Explicit tier → canonical theme mapping. Exhaustive Record over the
  // 5-tier system per src/lib/ratingTier.ts.
  const OVERLAY_KEY_TO_THEME: Record<keyof typeof tierOverlayThemes, RatingTheme> = {
    exceptional: COURSE_RATING_THEMES.EXCEPTIONAL,
    excellent: COURSE_RATING_THEMES.EXCELLENT,
    good: COURSE_RATING_THEMES.GOOD,
    fair: COURSE_RATING_THEMES.FAIR,
    poor: COURSE_RATING_THEMES.POOR,
  };
  const baseTheme = OVERLAY_KEY_TO_THEME[key] ?? COURSE_RATING_THEMES.GOOD;

  return {
    ...baseTheme,
    ...tierOverlayThemes[key],
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
  courseCountry?: string | null;
  courseRegion?: string | null;
  courseSubCountry?: string | null;
  reviewText?: string | null;
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
