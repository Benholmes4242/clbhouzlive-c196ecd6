/**
 * Progress Insight Copy System
 * 
 * Provides emotionally consistent, milestone-aware phrases for Top 100 progress bars.
 * Uses deterministic rotation (not random) to avoid visual chaos.
 */

// Phrase buckets by progress tier
const EARLY_PHRASES = ['Journey begins', 'First steps', 'On the board'];
const MOMENTUM_PHRASES = ['Momentum building', 'Finding rhythm', 'Progress underway', 'Gaining ground'];
const ESTABLISHED_PHRASES = ['Taking shape', 'Well underway', 'Serious progress', 'Confidence growing'];
const STRONG_PHRASES = ['Halfway mastery', 'Deep into it', 'Commitment showing', 'Impressive pace'];
const LEGENDARY_PHRASE = 'Legendary territory';

// Region progress modifiers - smaller regions feel rewarding sooner
const REGION_MODIFIERS: Record<string, number> = {
  'global': 1.0,
  'worldwide': 1.0,
  'gb-ireland': 1.15,
  'gbi': 1.15,
  'usa': 1.1,
  'europe': 1.2,
};

/**
 * Simple string hash for deterministic rotation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get the region modifier for progress weighting
 */
function getRegionModifier(listSlug: string): number {
  const normalizedSlug = listSlug.toLowerCase().replace(/[_\s]/g, '-');
  
  for (const [key, modifier] of Object.entries(REGION_MODIFIERS)) {
    if (normalizedSlug.includes(key)) {
      return modifier;
    }
  }
  
  return 1.0; // Default modifier
}

/**
 * Check if progress is at an exact milestone (10%, 25%, 50%)
 */
function isExactMilestone(progress: number): boolean {
  // Allow small tolerance for floating point
  const milestones = [10, 25, 50];
  return milestones.some(m => Math.abs(progress - m) < 0.5);
}

/**
 * Get progress insight phrase for a Top 100 list card
 * 
 * @param rawProgress - Raw progress percentage (0-100)
 * @param listSlug - Unique identifier for the list (e.g., 'global', 'usa', 'gbi')
 * @param userId - Optional user ID for deterministic rotation
 * @param usedPhrases - Set of phrases already used in viewport (to avoid duplicates)
 */
export function getProgressInsight(
  rawProgress: number,
  listSlug: string,
  userId?: string,
  usedPhrases?: Set<string>
): string {
  // Apply region modifier for adjusted progress feel
  const regionModifier = getRegionModifier(listSlug);
  const adjustedProgress = Math.min(rawProgress * regionModifier, 100);
  
  // Legendary territory - single phrase, never rotated
  if (adjustedProgress >= 75) {
    return LEGENDARY_PHRASE;
  }
  
  // Select phrase pool based on adjusted progress
  let pool: string[];
  if (adjustedProgress >= 50) {
    pool = STRONG_PHRASES;
  } else if (adjustedProgress >= 25) {
    pool = ESTABLISHED_PHRASES;
  } else if (adjustedProgress >= 10) {
    pool = MOMENTUM_PHRASES;
  } else {
    pool = EARLY_PHRASES;
  }
  
  // At exact milestone, show first phrase in tier
  if (isExactMilestone(rawProgress)) {
    const phrase = pool[0];
    return usedPhrases?.has(phrase) ? getAlternateFromPool(pool, phrase, usedPhrases) : phrase;
  }
  
  // Deterministic rotation based on userId + listSlug
  const seed = `${userId || 'anonymous'}-${listSlug}`;
  const rotationIndex = hashString(seed) % pool.length;
  
  let selectedPhrase = pool[rotationIndex];
  
  // Avoid duplicate phrases in viewport
  if (usedPhrases?.has(selectedPhrase)) {
    selectedPhrase = getAlternateFromPool(pool, selectedPhrase, usedPhrases);
  }
  
  return selectedPhrase;
}

/**
 * Get an alternate phrase from pool when primary is already used
 */
function getAlternateFromPool(pool: string[], excluded: string, usedPhrases: Set<string>): string {
  for (const phrase of pool) {
    if (phrase !== excluded && !usedPhrases.has(phrase)) {
      return phrase;
    }
  }
  // Fallback to first phrase if all are used (edge case with many cards)
  return pool[0];
}

/**
 * Hook helper: Get all progress insights for multiple lists while avoiding duplicates
 */
export function getProgressInsightsForLists(
  lists: Array<{ slug: string; progress: number }>,
  userId?: string
): Map<string, string> {
  const usedPhrases = new Set<string>();
  const result = new Map<string, string>();
  
  for (const list of lists) {
    const phrase = getProgressInsight(list.progress, list.slug, userId, usedPhrases);
    result.set(list.slug, phrase);
    usedPhrases.add(phrase);
  }
  
  return result;
}
