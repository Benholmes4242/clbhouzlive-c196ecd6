// ═══════════════════════════════════════════════════════════════════════════════════════════
// REGIONAL THEME SYSTEM FOR TOP 100 LISTS
// Provides consistent color identity, mythology, and copy across milestone tokens, 
// progress bars, achievements, and UI accents
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type Top100ListSlug = 'global' | 'gb-i' | 'usa' | 'europe';

export interface RegionTheme {
  slug: Top100ListSlug;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Names & Identity
  // ─────────────────────────────────────────────────────────────────────────
  /** Primary label (always visible): e.g. "Worldwide Top 100" */
  primaryLabel: string;
  /** Secondary prestige name: e.g. "World Pinnacle 100" */
  prestigeName: string;
  /** Short region identifier */
  shortName: string;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Intro Copy (First Visit)
  // ─────────────────────────────────────────────────────────────────────────
  /** One-line intro shown on first visit */
  introCopy: string;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Completion Titles & Badges
  // ─────────────────────────────────────────────────────────────────────────
  /** Title earned at 100/100 completion */
  completionTitle: string;
  /** Alternative grander title (optional use) */
  completionTitleAlt: string;
  /** Badge description/feel */
  badgeFeel: string;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Colors & Styling (CSS/Tailwind)
  // ─────────────────────────────────────────────────────────────────────────
  /** CSS color value for SVG strokes and inline styles */
  ringColor: string;
  /** Tailwind class for text color */
  textClass: string;
  /** Tailwind class for backgrounds (with opacity) */
  bgClass: string;
  /** Tailwind class for progress bar fill */
  barClass: string;
  /** Subtle halo gradient for next up token */
  haloGradient: string;
}

/**
 * Get the theme configuration for a Top 100 list.
 * Uses CSS custom properties defined in index.css.
 */
export function getRegionTheme(listSlug: string): RegionTheme {
  switch (listSlug) {
    case 'gb-i':
      return {
        slug: 'gb-i',
        // Names
        primaryLabel: 'GB&I Top 100',
        prestigeName: 'GB&I Heritage 100',
        shortName: 'GB&I',
        // Intro (first visit)
        introCopy: "A celebration of golf's origins — the most storied courses across Great Britain & Ireland.",
        // Completion
        completionTitle: 'Heritage Finisher',
        completionTitleAlt: 'Custodian of the Classics',
        badgeFeel: 'Traditional, earned, timeless',
        // Colors
        ringColor: 'rgb(var(--region-gbi))',
        textClass: 'text-region-gbi',
        bgClass: 'bg-region-gbi/10',
        barClass: 'bg-region-gbi',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-gbi) / 0.12) 0%, transparent 60%)',
      };
    case 'usa':
      return {
        slug: 'usa',
        // Names
        primaryLabel: 'USA Top 100',
        prestigeName: 'American Majors 100',
        shortName: 'USA',
        // Intro (first visit)
        introCopy: 'Bold, iconic, and unforgettable — the defining courses of American golf.',
        // Completion
        completionTitle: 'Majors Finisher',
        completionTitleAlt: 'Major Course Conqueror',
        badgeFeel: 'Powerful, competitive, iconic',
        // Colors
        ringColor: 'rgb(var(--region-usa))',
        textClass: 'text-region-usa',
        bgClass: 'bg-region-usa/10',
        barClass: 'bg-region-usa',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-usa) / 0.12) 0%, transparent 60%)',
      };
    case 'europe':
      return {
        slug: 'europe',
        // Names
        primaryLabel: 'Europe Top 100',
        prestigeName: 'European Masters 100',
        shortName: 'Europe',
        // Intro (first visit)
        introCopy: "From classic parkland to dramatic coastlines — Europe's finest championship courses.",
        // Completion
        completionTitle: 'Masters Finisher',
        completionTitleAlt: 'European Master',
        badgeFeel: 'Refined, elite, composed',
        // Colors
        ringColor: 'rgb(var(--region-europe))',
        textClass: 'text-region-europe',
        bgClass: 'bg-region-europe/10',
        barClass: 'bg-region-europe',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-europe) / 0.12) 0%, transparent 60%)',
      };
    case 'global':
    default:
      return {
        slug: 'global',
        // Names
        primaryLabel: 'Worldwide Top 100',
        prestigeName: 'World Pinnacle 100',
        shortName: 'Worldwide',
        // Intro (first visit)
        introCopy: 'The ultimate test — the greatest golf courses on the planet.',
        // Completion
        completionTitle: 'Pinnacle Finisher',
        completionTitleAlt: 'World Pinnacle Elite',
        badgeFeel: 'Rare, ultimate, aspirational',
        // Colors
        ringColor: 'rgb(var(--region-global))',
        textClass: 'text-region-global',
        bgClass: 'bg-region-global/10',
        barClass: 'bg-region-global',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-global) / 0.15) 0%, transparent 60%)',
      };
  }
}

/**
 * Get share copy for list completion.
 * Clean, confident, no emojis.
 */
export function getCompletionShareCopy(listSlug: string): string {
  const theme = getRegionTheme(listSlug);
  return `${theme.completionTitle} — ${theme.prestigeName} complete.`;
}

/**
 * Get modal headline for list completion.
 */
export function getCompletionModalCopy(listSlug: string): { headline: string; subtext: string } {
  const theme = getRegionTheme(listSlug);
  return {
    headline: `${theme.prestigeName} — Completed`,
    subtext: `You are now a ${theme.completionTitle}.`,
  };
}

/**
 * Aspirational copy for the NEXT UP milestone token.
 * Replaces mechanical "X to go" with emotionally-driven language.
 */
export function getAspirationalCopy(toGo: number, nextMilestone: number): string {
  // Very close - excitement
  if (toGo <= 2) return 'Almost there';
  if (toGo <= 5) return 'Closing in';
  
  // Halfway or more through this milestone segment
  const progress = (nextMilestone - toGo) / nextMilestone;
  if (progress >= 0.5) return 'On the hunt';
  
  // Just started this milestone segment
  return `Chasing ${nextMilestone}`;
}

/**
 * Detailed tooltip text explaining progress toward next milestone.
 * Encouraging, calm tone.
 */
export function getMilestoneTooltip(
  playedCount: number, 
  toGo: number, 
  nextMilestone: number
): string {
  const progress = playedCount / nextMilestone;
  
  if (toGo === 1) {
    return `Just 1 more course to reach ${nextMilestone}. You've got this.`;
  }
  
  if (progress >= 0.75) {
    return `Only ${toGo} more courses to the ${nextMilestone} milestone. Finish strong.`;
  }
  
  if (progress >= 0.5) {
    return `You're over halfway there — ${toGo} courses to reach ${nextMilestone}.`;
  }
  
  return `This milestone unlocks at ${nextMilestone} courses played. ${toGo} to go.`;
}
