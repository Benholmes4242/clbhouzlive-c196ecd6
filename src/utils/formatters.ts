/**
 * Formatting utilities for consistent display across the app.
 * These are the SINGLE SOURCE OF TRUTH for display formatting.
 */

/**
 * Formats a community rating score for display.
 * Always returns one decimal place for consistency across all surfaces.
 * 
 * @param score - The rating score (0-10 scale)
 * @returns Formatted string like "8.3" or "—" if null/undefined
 */
export function formatCommunityRating(score: number | null | undefined): string {
  if (score == null) return '—';
  return score.toFixed(1);
}

/**
 * Cache time constants for React Query.
 * Ensures consistent caching behavior across all rating-related queries.
 */
export const CACHE_TIMES = {
  /** 5 minutes - for rating aggregates and related data */
  RATING_AGGREGATES: 5 * 60 * 1000,
  /** 10 minutes - for stable course data */
  COURSE_DATA: 10 * 60 * 1000,
  /** 2 minutes - for frequently changing user data */
  USER_DATA: 2 * 60 * 1000,
} as const;

/**
 * Format a display name as two lines (first name + last name)
 * Used by podium components for consistent name display
 */
export function formatNameTwoLines(
  displayName: string | null, 
  username: string | null
): { firstName: string; lastName: string | null } {
  const name = displayName || username || 'Unknown';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}
