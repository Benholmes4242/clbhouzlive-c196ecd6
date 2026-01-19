/**
 * Phase 4: Gamification Depth - Badge Asset Imports
 * 
 * Centralizes all badge image imports for streak and combination achievements.
 */

// Streak badges
import streakCommittedBadge from '@/assets/badges/streak-committed.png';
import streakDevotedBadge from '@/assets/badges/streak-devoted.png';
import streakObsessedBadge from '@/assets/badges/streak-obsessed.png';

// Combination badges
import linksLoverBadge from '@/assets/badges/links-lover.png';
import parklandPioneerBadge from '@/assets/badges/parkland-pioneer.png';
import islandHopperBadge from '@/assets/badges/island-hopper.png';
import majorHunterBadge from '@/assets/badges/major-hunter.png';
import homeNationsBadge from '@/assets/badges/home-nations.png';

// ═══════════════════════════════════════════════════════════════════════════════════════════
// STREAK BADGE IMAGES - Keyed by threshold months
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const STREAK_BADGE_IMAGES: Record<number, string> = {
  3: streakCommittedBadge,
  6: streakDevotedBadge,
  12: streakObsessedBadge,
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// COMBINATION BADGE IMAGES - Keyed by achievement ID
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const COMBINATION_BADGE_IMAGES: Record<string, string> = {
  'links-lover': linksLoverBadge,
  'parkland-pioneer': parklandPioneerBadge,
  'island-hopper': islandHopperBadge,
  'major-hunter': majorHunterBadge,
  'home-nations': homeNationsBadge,
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Get streak badge image by threshold months
 */
export function getStreakBadgeImage(thresholdMonths: number): string | undefined {
  return STREAK_BADGE_IMAGES[thresholdMonths];
}

/**
 * Get combination badge image by achievement ID
 */
export function getCombinationBadgeImage(achievementId: string): string | undefined {
  return COMBINATION_BADGE_IMAGES[achievementId];
}

/**
 * Get any Phase 4 badge image by ID (supports both streak-X and combination IDs)
 */
export function getPhase4BadgeImage(id: string): string | undefined {
  // Check if it's a streak achievement
  if (id.startsWith('streak-')) {
    const threshold = parseInt(id.replace('streak-', ''), 10);
    return STREAK_BADGE_IMAGES[threshold];
  }
  
  // Otherwise check combination achievements
  return COMBINATION_BADGE_IMAGES[id];
}
