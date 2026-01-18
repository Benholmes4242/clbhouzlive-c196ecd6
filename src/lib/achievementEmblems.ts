/**
 * Achievement Emblems Map
 * 
 * Maps achievement tier keys to their corresponding SVG emblem paths.
 * Used by AchievementBadgeCard to display subtle "engraved" background crests.
 */

export const ACHIEVEMENT_EMBLEMS: Record<string, string> = {
  // Top 100 milestone clubs (by tier key)
  '5': '/emblems/badge-top100-5-rookie.png',
  '10': '/emblems/emblem-top100-10-fairway.svg',
  '20': '/emblems/emblem-top100-20-founders-lion.svg',
  '50': '/emblems/emblem-top100-50-heritage-shield.svg',
  '100': '/emblems/emblem-top100-100-century-laurel.svg',
  '200': '/emblems/emblem-top100-200-elite-star.svg',
  '300': '/emblems/emblem-top100-300-legendary-crossed-clubs.svg',
  '400': '/emblems/emblem-top100-400-grand-slam-crown.svg',

  // Completed list achievements (by tier key)
  'GBI': '/emblems/emblem-list-gbi-celtic.svg',
  'EU': '/emblems/emblem-list-europe-compass.svg',
  'USA': '/emblems/emblem-list-usa-eagle.svg',
  'WORLD': '/emblems/emblem-list-world-globe.svg',
};

/**
 * Get emblem path for a given achievement tier
 */
export function getEmblemPath(tier: string): string | null {
  return ACHIEVEMENT_EMBLEMS[tier] || null;
}
