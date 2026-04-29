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

// ═══════════════════════════════════════════════════════════════════════════════════════════
// UNIFIED SHEET TAGLINES — editorial copy per tier, state-aware
// Used exclusively by UnifiedAchievementSheet. Does NOT replace existing exports.
// ═══════════════════════════════════════════════════════════════════════════════════════════

interface SheetTaglineSet {
  unlocked: string;
  locked: string;
  peerUnlocked: string;
  peerLocked: string;
}

const MILESTONE_SHEET_TAGLINES: Record<number, SheetTaglineSet> = {
  5: {
    unlocked: 'Five of the greatest, on your card.',
    locked: 'Play five Top 100 courses to unlock.',
    peerUnlocked: "{name}'s through the first five.",
    peerLocked: "{name}'s on {played} of 5 Top 100 courses.",
  },
  10: {
    unlocked: 'Past the casual mark. The tour is real now.',
    locked: 'Ten courses in. The journey takes shape.',
    peerUnlocked: "{name}'s past the casual mark.",
    peerLocked: "{name}'s on {played} of 10 Top 100 courses.",
  },
  20: {
    unlocked: "You're a serious player on the road.",
    locked: 'Twenty courses · the work begins to show.',
    peerUnlocked: "{name}'s a serious player on the road.",
    peerLocked: "{name}'s on {played} of 20 Top 100 courses.",
  },
  50: {
    unlocked: "Halfway to a life's work.",
    locked: 'Fifty courses · the halfway mark.',
    peerUnlocked: "{name}'s crossed the 50-course mark.",
    peerLocked: "{name}'s on {played} of 50 Top 100 courses.",
  },
  100: {
    unlocked: 'Top 100 played. The list is yours.',
    locked: 'One hundred courses · the Quest complete.',
    peerUnlocked: "{name}'s done the full hundred.",
    peerLocked: "{name}'s on {played} of 100 Top 100 courses.",
  },
  200: {
    unlocked: 'Two hundred and counting. Few get here.',
    locked: 'Two hundred · into rare company.',
    peerUnlocked: "{name}'s past two hundred. Rare company.",
    peerLocked: "{name}'s on {played} of 200 Top 100 courses.",
  },
  300: {
    unlocked: 'Three hundred. A career on the road.',
    locked: 'Three hundred · few have come this far.',
    peerUnlocked: "{name}'s past three hundred.",
    peerLocked: "{name}'s on {played} of 300 Top 100 courses.",
  },
  400: {
    unlocked: 'Four hundred. The list is a footnote now.',
    locked: 'Four hundred · uncharted territory.',
    peerUnlocked: "{name}'s past four hundred. Uncharted.",
    peerLocked: "{name}'s on {played} of 400 Top 100 courses.",
  },
};

const REGIONAL_SHEET_TAGLINES: Record<string, SheetTaglineSet> = {
  'gb-i': {
    unlocked: 'Every links and inland gem on home soil.',
    locked: 'The home circuit · birth of the game.',
    peerUnlocked: "{name}'s played every GB&I Top 100 course.",
    peerLocked: "{name}'s on {played} of {total} GB&I courses.",
  },
  europe: {
    unlocked: "The continent's finest, all played.",
    locked: 'From the Algarve to the Alps.',
    peerUnlocked: "{name}'s played every Europe Top 100 course.",
    peerLocked: "{name}'s on {played} of {total} Europe courses.",
  },
  usa: {
    unlocked: 'Coast to coast. Every great American course.',
    locked: 'The big country · big golf.',
    peerUnlocked: "{name}'s played every USA Top 100 course.",
    peerLocked: "{name}'s on {played} of {total} USA courses.",
  },
  global: {
    unlocked: "The whole world's Top 100. Played.",
    locked: "Every continent's best on one list.",
    peerUnlocked: "{name}'s played every Global Top 100 course.",
    peerLocked: "{name}'s on {played} of {total} Global courses.",
  },
};

function applyTokens(template: string, tokens: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(tokens[key] ?? ''));
}

/** Get unified-sheet tagline for a milestone. */
export function getSheetMilestoneTagline(
  threshold: number,
  isUnlocked: boolean,
  mode: 'browse' | 'celebrate' | 'peer',
  context: { firstName?: string; played?: number } = {}
): string {
  const set = MILESTONE_SHEET_TAGLINES[threshold];
  if (!set) return '';

  if (mode === 'peer') {
    const name = context.firstName || 'They';
    const template = isUnlocked ? set.peerUnlocked : set.peerLocked;
    return applyTokens(template, { name, played: context.played ?? 0 });
  }

  return isUnlocked ? set.unlocked : set.locked;
}

/** Get unified-sheet tagline for a regional achievement. */
export function getSheetRegionalTagline(
  listSlug: string,
  isUnlocked: boolean,
  mode: 'browse' | 'celebrate' | 'peer',
  context: { firstName?: string; played?: number; total?: number } = {}
): string {
  const set = REGIONAL_SHEET_TAGLINES[listSlug];
  if (!set) return '';

  if (mode === 'peer') {
    const name = context.firstName || 'They';
    const template = isUnlocked ? set.peerUnlocked : set.peerLocked;
    return applyTokens(template, { name, played: context.played ?? 0, total: context.total ?? 100 });
  }

  return isUnlocked ? set.unlocked : set.locked;
}
