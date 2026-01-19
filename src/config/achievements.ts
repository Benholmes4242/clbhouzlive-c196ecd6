/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                    ACHIEVEMENT MILESTONES - SINGLE SOURCE OF TRUTH                        ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                                          ║
 * ║  This file defines the ONLY authoritative list of milestone thresholds.                  ║
 * ║  ALL other files MUST import from here - no duplicate threshold definitions allowed.     ║
 * ║                                                                                          ║
 * ║  Consumers:                                                                               ║
 * ║    • src/lib/top100Club.ts (CLUB_STEPS)                                                  ║
 * ║    • src/lib/achievementDefinitions.ts (MILESTONE_ACHIEVEMENTS)                          ║
 * ║    • src/lib/globalAchievementMilestoneSystem.ts (MILESTONE_THEMES)                      ║
 * ║    • src/components/quest/MilestoneLadder.tsx                                            ║
 * ║    • src/components/achievements/AchievementBadgeCard.tsx                                ║
 * ║                                                                                          ║
 * ║  NEVER add milestone thresholds elsewhere - always reference this file.                  ║
 * ║                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE THRESHOLDS - The 8 clubs from Rookie (5) to Grand Slam (400)
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENT_MILESTONES = [
  5, 10, 20, 50, 100, 200, 300, 400,
] as const;

export type AchievementMilestone = (typeof ACHIEVEMENT_MILESTONES)[number];

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER METADATA - Names and identifiers for each milestone
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type MilestoneTierId =
  | 'none'
  | 'rookie'
  | 'fairway'
  | 'founders'
  | 'heritage'
  | 'century'
  | 'elite'
  | 'legendary'
  | 'grandslam';

export interface MilestoneTierMeta {
  threshold: AchievementMilestone;
  tierId: MilestoneTierId;
  tierName: string;     // Full name e.g. "Rookie Club"
  shortLabel: string;   // Short display e.g. "Rookie"
}

/**
 * Complete metadata for each milestone tier.
 * Ordered lowest → highest.
 */
export const MILESTONE_TIER_META: readonly MilestoneTierMeta[] = [
  { threshold: 5,   tierId: 'rookie',    tierName: 'Rookie Club',     shortLabel: 'Rookie' },
  { threshold: 10,  tierId: 'fairway',   tierName: 'Fairway Club',    shortLabel: 'Fairway' },
  { threshold: 20,  tierId: 'founders',  tierName: 'Founders Club',   shortLabel: 'Founders' },
  { threshold: 50,  tierId: 'heritage',  tierName: 'Heritage Club',   shortLabel: 'Heritage' },
  { threshold: 100, tierId: 'century',   tierName: 'Century Club',    shortLabel: 'Century' },
  { threshold: 200, tierId: 'elite',     tierName: 'Elite Club',      shortLabel: 'Elite' },
  { threshold: 300, tierId: 'legendary', tierName: 'Legendary Club',  shortLabel: 'Legendary' },
  { threshold: 400, tierId: 'grandslam', tierName: 'Grand Slam Club', shortLabel: 'Grand Slam' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Get the next milestone for a given courses played count.
 * Returns null if all milestones have been achieved.
 */
export function getNextMilestone(coursesPlayed: number): AchievementMilestone | null {
  return ACHIEVEMENT_MILESTONES.find(m => m > coursesPlayed) ?? null;
}

/**
 * Get all unlocked milestones for a given courses played count.
 * Returns milestones where threshold <= coursesPlayed.
 */
export function getUnlockedMilestones(coursesPlayed: number): AchievementMilestone[] {
  return ACHIEVEMENT_MILESTONES.filter(m => m <= coursesPlayed);
}

/**
 * Get milestone display name by threshold.
 */
export function getMilestoneName(threshold: number): string {
  const meta = MILESTONE_TIER_META.find(m => m.threshold === threshold);
  return meta?.tierName ?? `${threshold} Club`;
}

/**
 * Get tier metadata by threshold.
 */
export function getMilestoneMetaByThreshold(threshold: number): MilestoneTierMeta | undefined {
  return MILESTONE_TIER_META.find(m => m.threshold === threshold);
}

/**
 * Get tier metadata by tier ID.
 */
export function getMilestoneMetaByTierId(tierId: MilestoneTierId): MilestoneTierMeta | undefined {
  return MILESTONE_TIER_META.find(m => m.tierId === tierId);
}

/**
 * Check if a number is a valid milestone threshold.
 */
export function isValidMilestone(threshold: number): threshold is AchievementMilestone {
  return ACHIEVEMENT_MILESTONES.includes(threshold as AchievementMilestone);
}

/**
 * Get the current milestone for a given courses played count.
 * Returns the highest milestone where threshold <= coursesPlayed.
 */
export function getCurrentMilestone(coursesPlayed: number): AchievementMilestone | null {
  const unlocked = getUnlockedMilestones(coursesPlayed);
  return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
}

/**
 * Get the current milestone metadata for a given courses played count.
 */
export function getCurrentMilestoneMeta(coursesPlayed: number): MilestoneTierMeta | null {
  const current = getCurrentMilestone(coursesPlayed);
  if (current === null) return null;
  return getMilestoneMetaByThreshold(current) ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PHASE 4: STREAK ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const STREAK_ACHIEVEMENTS = [
  {
    id: 'streak-3',
    name: '3-Month Streak',
    tierName: 'Committed',
    threshold: 3,
    description: 'Log Top 100 courses for 3 consecutive months',
    badgeImage: 'streakCommittedBadge',
  },
  {
    id: 'streak-6',
    name: '6-Month Streak',
    tierName: 'Devoted',
    threshold: 6,
    description: 'Log Top 100 courses for 6 consecutive months',
    badgeImage: 'streakDevotedBadge',
  },
  {
    id: 'streak-12',
    name: '12-Month Streak',
    tierName: 'Obsessed',
    threshold: 12,
    description: 'Log Top 100 courses for 12 consecutive months',
    badgeImage: 'streakObsessedBadge',
  },
] as const;

export type StreakAchievementId = (typeof STREAK_ACHIEVEMENTS)[number]['id'];

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PHASE 4: COMBINATION ACHIEVEMENT BADGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const COMBINATION_ACHIEVEMENT_BADGES: Record<string, string> = {
  'links-lover': 'linksLoverBadge',
  'parkland-pioneer': 'parklandPioneerBadge',
  'island-hopper': 'islandHopperBadge',
  'major-hunter': 'majorHunterBadge',
  'home-nations': 'homeNationsBadge',
};
