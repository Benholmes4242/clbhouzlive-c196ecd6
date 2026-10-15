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
// MILESTONE THRESHOLDS - The 6 per-list clubs, 5 Club to 100 Club. One list = 100 courses.
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENT_MILESTONES = [5, 10, 20, 30, 50, 100] as const;

export type AchievementMilestone = (typeof ACHIEVEMENT_MILESTONES)[number];

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TIER METADATA - Names and identifiers for each milestone
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type MilestoneTierId =
  | 'none'
  | 'rookie'
  | 'fairway'
  | 'founders'
  | 'thirty'
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
 * The tierId values are FROZEN and no longer describe their names — the names
 * are now numeric ('fairway' is the id behind '10 Club'). They key rows already
 * written in the database and the DivisionSlug union in
 * src/types/championship.ts. Rename the NAME, never the ID. 'elite',
 * 'legendary' and 'grandslam' (200/300/400) are retired from the ladder but
 * kept in the MilestoneTierId union: a single list holds 100 courses, so those
 * thresholds cannot be reached per-list. They are reserved for a future
 * across-all-lists ladder, where the ceiling is 330 distinct courses.
 */
/**
 * Complete metadata for each milestone tier.
 * Ordered lowest → highest.
 */
export const MILESTONE_TIER_META: readonly MilestoneTierMeta[] = [
  { threshold: 5,   tierId: 'rookie',   tierName: '5 Club',   shortLabel: '5' },
  { threshold: 10,  tierId: 'fairway',  tierName: '10 Club',  shortLabel: '10' },
  { threshold: 20,  tierId: 'founders', tierName: '20 Club',  shortLabel: '20' },
  { threshold: 30,  tierId: 'thirty',   tierName: '30 Club',  shortLabel: '30' },
  { threshold: 50,  tierId: 'heritage', tierName: '50 Club',  shortLabel: '50' },
  { threshold: 100, tierId: 'century',  tierName: '100 Club', shortLabel: '100' },
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
