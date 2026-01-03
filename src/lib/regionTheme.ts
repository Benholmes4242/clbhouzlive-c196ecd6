// ═══════════════════════════════════════════════════════════════════════════════════════════
// REGIONAL THEME SYSTEM FOR TOP 100 LISTS
// Provides consistent color identity across milestone tokens, progress bars, and UI accents
// ═══════════════════════════════════════════════════════════════════════════════════════════

export type Top100ListSlug = 'global' | 'gb-i' | 'usa' | 'europe';

export interface RegionTheme {
  slug: Top100ListSlug;
  name: string;
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
        name: 'Great Britain & Ireland',
        ringColor: 'rgb(var(--region-gbi))',
        textClass: 'text-region-gbi',
        bgClass: 'bg-region-gbi/10',
        barClass: 'bg-region-gbi',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-gbi) / 0.12) 0%, transparent 60%)',
      };
    case 'usa':
      return {
        slug: 'usa',
        name: 'USA',
        ringColor: 'rgb(var(--region-usa))',
        textClass: 'text-region-usa',
        bgClass: 'bg-region-usa/10',
        barClass: 'bg-region-usa',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-usa) / 0.12) 0%, transparent 60%)',
      };
    case 'europe':
      return {
        slug: 'europe',
        name: 'Europe',
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
        name: 'Worldwide',
        ringColor: 'rgb(var(--region-global))',
        textClass: 'text-region-global',
        bgClass: 'bg-region-global/10',
        barClass: 'bg-region-global',
        haloGradient: 'radial-gradient(circle at center, rgb(var(--region-global) / 0.15) 0%, transparent 60%)',
      };
  }
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
