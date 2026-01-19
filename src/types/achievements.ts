/**
 * Phase 4: Gamification Depth - Achievement Types
 * 
 * This file defines types for streak and combination achievements.
 * Milestone achievements are defined in src/config/achievements.ts
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// USER STREAK TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak_months: number;
  current_streak_start: string | null;
  last_activity_month: string | null;
  longest_streak_months: number;
  longest_streak_start: string | null;
  longest_streak_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreakAchievement {
  achievement_id: string;
  achievement_name: string;
  tier_name: string;
  threshold_months: number;
  is_earned: boolean;
  earned_at: string | null;
  current_progress: number;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COMBINATION ACHIEVEMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export interface CombinationAchievement {
  achievement_id: string;
  achievement_name: string;
  tier_name: string;
  description: string;
  target_value: number;
  current_progress: number;
  is_earned: boolean;
  progress_details: Record<string, unknown> | null;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// UNIFIED ACHIEVEMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type AchievementCategory = 'milestone' | 'streak' | 'combination' | 'social';

export interface UnifiedAchievement {
  id: string;
  name: string;
  tier_name: string;
  description: string;
  category: AchievementCategory;
  target: number;
  progress: number;
  is_earned: boolean;
  badge_image?: string;
  earned_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// STREAK ACHIEVEMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const STREAK_ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'streak-3',
    name: '3-Month Streak',
    tierName: 'Committed',
    threshold: 3,
    description: 'Log Top 100 courses for 3 consecutive months',
    badgeImageKey: 'streakCommittedBadge',
  },
  {
    id: 'streak-6',
    name: '6-Month Streak',
    tierName: 'Devoted',
    threshold: 6,
    description: 'Log Top 100 courses for 6 consecutive months',
    badgeImageKey: 'streakDevotedBadge',
  },
  {
    id: 'streak-12',
    name: '12-Month Streak',
    tierName: 'Obsessed',
    threshold: 12,
    description: 'Log Top 100 courses for 12 consecutive months',
    badgeImageKey: 'streakObsessedBadge',
  },
] as const;
