/**
 * Dark Golf Passport - Profile V2 Types
 */

export interface ProfileV2User {
  id: string;
  displayName: string;
  username: string;
  clubName?: string;
  handicapIndex?: number;
  avatarUrl?: string;
  heroMediaUrl?: string;
  heroMediaType?: 'image' | 'video';
  xp: number;
  bio?: string;
  location?: string;
  isVerified?: boolean;
}

export type XPTier = 'bronze' | 'blue' | 'green' | 'silver' | 'gold';

export interface XPRingConfig {
  tier: XPTier;
  color: string;
  glowColor: string;
  threshold: number;
}

export const XP_TIERS: XPRingConfig[] = [
  { tier: 'bronze', color: '#CD7F32', glowColor: 'rgba(205, 127, 50, 0.4)', threshold: 0 },
  { tier: 'blue', color: '#4A9EE3', glowColor: 'rgba(74, 158, 227, 0.4)', threshold: 10000 },
  { tier: 'green', color: '#6e9277', glowColor: 'rgba(110, 146, 119, 0.4)', threshold: 20000 },
  { tier: 'silver', color: '#B8C4D0', glowColor: 'rgba(184, 196, 208, 0.4)', threshold: 30000 },
  { tier: 'gold', color: '#C8B06A', glowColor: 'rgba(200, 176, 106, 0.4)', threshold: 40000 },
];

export function getXPTier(xp: number): XPRingConfig {
  // Find the highest tier the user qualifies for
  for (let i = XP_TIERS.length - 1; i >= 0; i--) {
    if (xp >= XP_TIERS[i].threshold) {
      return XP_TIERS[i];
    }
  }
  return XP_TIERS[0];
}

export interface GolfDNAStats {
  handicapTrend: number[]; // Last 10-20 data points
  roundsThisYear: number;
  coursesPlayed: number;
  top100Progress: number; // x out of 100
  currentHandicap?: number;
  recentForm?: string[]; // Last 5 round scores
}

export interface MomentPost {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string; // For video poster frame
  courseName?: string;
  courseId?: string;
  caption?: string;
  date: string;
  likesCount: number;
  commentsCount: number;
}

export interface Trophy {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  isUnlocked: boolean;
  earnedDate?: string;
  isRare?: boolean;
  category?: string;
}

export interface CoursesWorldData {
  totalCoursesPlayed: number;
  top100Played: number;
  countries?: number;
  mapPreviewUrl?: string;
}
