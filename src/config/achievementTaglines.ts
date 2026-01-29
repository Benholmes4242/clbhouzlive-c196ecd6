/**
 * Taglines for milestones and regions - witty golf copy for collector cards
 * Used in AchievementBadgeCard, Journey Map, Trophy Case, and Mastery Track
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE TAGLINES - Punchy golf lines for each club tier
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const MILESTONE_TAGLINES: Record<number, string> = {
  5: "First tee nerves? You're officially on the tour.",
  10: "Finding fairways and ticking off bucket-list tracks.",
  20: "This is more than a hobby now. You're building a legacy.",
  50: "Proper golf pedigree. The journey's getting serious.",
  100: "100 down. More than most golfers dream of.",
  200: "You've entered rare air. Keep chasing greatness.",
  300: "Legendary. This separates the great from the rest.",
  400: "Only a handful ever reach this level. Seve. Jack. Tiger. You.",
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// REGION TAGLINES - Witty tooltip/subtitle copy for regional mastery
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const REGION_TAGLINES: Record<string, string> = {
  'gb-i': "Links, legends, and history. The spiritual home of golf, conquered.",
  'europe': "From coastlines to castles — Europe, conquered.",
  'usa': "Big stages. Big names. You've earned your stripes.",
  'global': "The rarest journey in the game. Worldwide mastery achieved.",
};

// ═══════════════════════════════════════════════════════════════════════════════════════════
// FULL REGION DISPLAY NAMES - For Mastery Track display
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const REGION_FULL_NAMES: Record<string, string> = {
  'gb-i': "GB&I Top 100",
  'europe': "Europe Top 100", 
  'usa': "USA Top 100",
  'global': "Global Top 100",
};

/**
 * Get the tagline for a milestone threshold
 */
export function getMilestoneTagline(threshold: number): string {
  return MILESTONE_TAGLINES[threshold] || "";
}

/**
 * Get the tagline for a region slug
 */
export function getRegionTagline(slug: string): string {
  return REGION_TAGLINES[slug] || "";
}

/**
 * Get the full display name for a region
 */
export function getRegionFullName(slug: string): string {
  return REGION_FULL_NAMES[slug] || "";
}
