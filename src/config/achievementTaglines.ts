/**
 * Taglines for milestones and regions - witty golf copy for collector cards
 * Used in AchievementBadgeCard, Journey Map, Trophy Case, and Mastery Track
 * 
 * Supports dynamic user context: shows "You're" for own profile, "[Name] is" for others
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════
// MILESTONE TAGLINES - Punchy golf lines for each club tier
// Static fallback for backward compatibility
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
// Static fallback for backward compatibility
// ═══════════════════════════════════════════════════════════════════════════════════════════

export const REGION_TAGLINES: Record<string, string> = {
  'gb-i': "Links, legends and history. The home of golf, conquered.",
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

// ═══════════════════════════════════════════════════════════════════════════════════════════
// DYNAMIC TAGLINE FUNCTIONS - User context aware
// ═══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Get the tagline for a milestone threshold with user context
 * @param threshold - The milestone threshold (5, 10, 20, etc.)
 * @param firstName - The user's first name (used when viewing another user's profile)
 * @param isOwnProfile - Whether viewing own profile (defaults to true)
 * @returns Contextual tagline string
 */
export function getMilestoneTagline(
  threshold: number,
  firstName?: string,
  isOwnProfile: boolean = true
): string {
  // Build contextual pronouns
  const subject = isOwnProfile ? "You're" : `${firstName || 'They'} ${firstName ? 'is' : 'are'}`;
  const subjectHave = isOwnProfile ? "You've" : `${firstName || 'They'} ${firstName ? 'has' : 'have'}`;
  const subjectPlain = isOwnProfile ? "You" : firstName || "They";

  switch (threshold) {
    case 5:
      return `First tee nerves? ${subject} officially on the tour.`;
    case 10:
      return "Finding fairways and ticking off bucket-list tracks.";
    case 20:
      return `This is more than a hobby now. ${subject} building a legacy.`;
    case 50:
      return "Proper golf pedigree. The journey's getting serious.";
    case 100:
      return "100 down. More than most golfers dream of.";
    case 200:
      return `${subjectHave} entered rare air. Keep chasing greatness.`;
    case 300:
      return `Legendary. This separates the great from the rest.`;
    case 400:
      return `Only a handful ever reach this level. Seve. Jack. Tiger. ${subjectPlain}.`;
    default:
      return `Awarded for playing ${threshold} Top 100 courses worldwide.`;
  }
}

/**
 * Get the tagline for a region slug with user context
 * @param slug - The region slug ('gb-i', 'europe', 'usa', 'global')
 * @param firstName - The user's first name (used when viewing another user's profile)
 * @param isOwnProfile - Whether viewing own profile (defaults to true)
 * @returns Contextual tagline string
 */
export function getRegionalTagline(
  slug: string,
  firstName?: string,
  isOwnProfile: boolean = true
): string {
  const subjectHave = isOwnProfile ? "You've" : `${firstName || 'They'} ${firstName ? 'has' : 'have'}`;

  switch (slug) {
    case 'gb-i':
      return "Links, legends and history. The home of golf, conquered.";
    case 'europe':
      return "From coastlines to castles — Europe, conquered.";
    case 'usa':
      return `Big stages. Big names. ${subjectHave} earned ${isOwnProfile ? 'your' : firstName ? `${firstName}'s` : 'their'} stripes.`;
    case 'global':
      return "The rarest journey in the game. Worldwide mastery achieved.";
    default:
      return REGION_TAGLINES[slug] || "";
  }
}

/**
 * Get the tagline for a region slug (static version for backward compatibility)
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
