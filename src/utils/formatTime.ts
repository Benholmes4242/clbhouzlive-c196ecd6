/**
 * Unified Time Formatting Utility
 * Single source of truth for relative time across the platform
 */

import { formatDistanceToNow } from 'date-fns';

/**
 * Format a date as relative time
 * @param date - Date to format
 * @param style - 'short' (11d, 5mo) or 'long' (4 months ago)
 */
export function formatTimeAgo(date: Date | string, style: 'short' | 'long' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (style === 'short') {
    return formatTimeAgoShort(dateObj);
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format as compact relative time (11d, 5mo, 2y)
 */
function formatTimeAgoShort(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  // Weeks bucket extends through the "0 months" gap — show weeks until we have
  // at least 1 whole month (30+ days). Prevents "0mo" for 4-week-old posts.
  if (diffMonths < 1) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${diffYears}y`;
}

/**
 * Format for activity feeds (Today, Yesterday, Last week, etc.)
 */
export function formatActivityTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Last week';
  if (diffDays < 30) return 'This month';
  if (diffDays < 60) return 'Last month';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
}
