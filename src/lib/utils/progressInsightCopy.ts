/**
 * Progress Insight Copy System
 * 
 * Provides emotionally consistent, milestone-aware phrases for Top 100 progress bars.
 * Uses deterministic rotation (not random) to avoid visual chaos.
 * 
 * Bands:
 * - 0–9%: early-stage phrases
 * - 10–24%: momentum phrases  
 * - 25–49%: commitment phrases
 * - 50–74%: achievement phrases
 * - 75%+: single legendary phrase
 * 
 * Milestone rules:
 * - At exactly 10%, 25%, 50%: show milestone-specific phrase
 * - At 75%+: always show legendary phrase
 */

// Phrase buckets by progress band
const EARLY_PHRASES = ['Journey begins', 'First steps', 'On the board'];
const MOMENTUM_PHRASES = ['Momentum building', 'Finding rhythm', 'Progress underway', 'Gaining ground'];
const COMMITMENT_PHRASES = ['Taking shape', 'Well underway', 'Serious progress', 'Confidence growing'];
const ACHIEVEMENT_PHRASES = ['Halfway mastery', 'Deep into it', 'Commitment showing', 'Impressive pace'];
const LEGENDARY_PHRASE = 'Legendary territory';

// Milestone-specific phrases (shown only at exact thresholds)
const MILESTONE_PHRASES: Record<number, string> = {
  10: 'First milestone',
  25: 'Quarter complete',
  50: 'Halfway there',
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
 * Get week number for persistence (phrases persist within a week)
 */
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

/**
 * Check if progress is at an exact milestone (10%, 25%, 50%)
 * Returns the milestone value if at one, otherwise null
 */
function getExactMilestone(progress: number): number | null {
  const milestones = [10, 25, 50];
  for (const m of milestones) {
    // Allow small tolerance for floating point (within 0.5%)
    if (Math.abs(progress - m) < 0.5) {
      return m;
    }
  }
  return null;
}

/**
 * Get phrase pool based on progress band
 */
function getPhrasePool(progress: number): string[] {
  if (progress >= 50) return ACHIEVEMENT_PHRASES;
  if (progress >= 25) return COMMITMENT_PHRASES;
  if (progress >= 10) return MOMENTUM_PHRASES;
  return EARLY_PHRASES;
}

/**
 * Get progress insight phrase for a Top 100 list card
 * 
 * @param rawProgress - Raw progress percentage (0-100)
 * @param listSlug - Unique identifier for the list (e.g., 'global', 'usa', 'gb-i')
 * @param userId - Optional user ID for deterministic rotation
 * @param usedPhrases - Set of phrases already used in viewport (to avoid duplicates)
 */
export function getProgressInsight(
  rawProgress: number,
  listSlug: string,
  userId?: string,
  usedPhrases?: Set<string>
): string {
  // Legendary territory - single phrase at 75%+, never rotated
  if (rawProgress >= 75) {
    return LEGENDARY_PHRASE;
  }
  
  // Check for exact milestone
  const exactMilestone = getExactMilestone(rawProgress);
  if (exactMilestone !== null && MILESTONE_PHRASES[exactMilestone]) {
    return MILESTONE_PHRASES[exactMilestone];
  }
  
  // Get appropriate phrase pool based on progress band
  const pool = getPhrasePool(rawProgress);
  
  // Deterministic rotation based on userId + listSlug + current week
  // This ensures phrase persists for a period but varies between lists
  const week = getCurrentWeek();
  const seed = `${userId || 'anonymous'}-${listSlug}-${week}`;
  const rotationIndex = hashString(seed) % pool.length;
  
  let selectedPhrase = pool[rotationIndex];
  
  // Avoid duplicate phrases in viewport if usedPhrases provided
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
