/**
 * Progress Insight Copy System
 * 
 * Provides emotionally consistent, milestone-aware phrases for Top 100 progress bars.
 * Uses deterministic rotation (not random) to avoid visual chaos.
 * 
 * Bands:
 * - 0%: "Start your journey"
 * - 1–10%: early-stage phrases  
 * - 11–25%: momentum phrases
 * - 26–50%: commitment phrases
 * - 51–75%: achievement phrases
 * - 76–99%: "Almost there"
 * - 100%: "Conquered ✨"
 * 
 * Milestone rules:
 * - At exactly 10%, 25%, 50%: show milestone-specific phrase
 */

const EARLY_PHRASES = ['Journey begins', 'First steps', 'On the board'];
const MOMENTUM_PHRASES = ['Building momentum', 'Finding rhythm', 'Progress underway', 'Gaining ground'];
const COMMITMENT_PHRASES = ['Well on your way', 'Taking shape', 'Serious progress', 'Confidence growing'];
const ACHIEVEMENT_PHRASES = ['The home stretch', 'Deep into it', 'Commitment showing', 'Impressive pace'];
const NEAR_COMPLETE_PHRASE = 'Almost there';
const LEGENDARY_PHRASE = 'Legendary territory';

const MILESTONE_PHRASES: Record<number, string> = {
  10: 'First milestone',
  25: 'Quarter complete',
  50: 'Halfway there',
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

function getExactMilestone(progress: number): number | null {
  const milestones = [10, 25, 50];
  for (const m of milestones) {
    if (Math.abs(progress - m) < 0.5) {
      return m;
    }
  }
  return null;
}

function getPhrasePool(progress: number): string[] {
  if (progress >= 76) return [NEAR_COMPLETE_PHRASE];
  if (progress >= 51) return ACHIEVEMENT_PHRASES;
  if (progress >= 26) return COMMITMENT_PHRASES;
  if (progress >= 11) return MOMENTUM_PHRASES;
  return EARLY_PHRASES;
}

/**
 * Get progress insight phrase for a Top 100 list card
 */
export function getProgressInsight(
  rawProgress: number,
  listSlug: string,
  userId?: string,
  usedPhrases?: Set<string>
): string {
  if (rawProgress >= 100) return 'Conquered ✨';
  if (rawProgress >= 76) return NEAR_COMPLETE_PHRASE;
  if (rawProgress >= 75) return LEGENDARY_PHRASE;
  
  const exactMilestone = getExactMilestone(rawProgress);
  if (exactMilestone !== null && MILESTONE_PHRASES[exactMilestone]) {
    return MILESTONE_PHRASES[exactMilestone];
  }
  
  const pool = getPhrasePool(rawProgress);
  const week = getCurrentWeek();
  const seed = `${userId || 'anonymous'}-${listSlug}-${week}`;
  const rotationIndex = hashString(seed) % pool.length;
  
  let selectedPhrase = pool[rotationIndex];
  
  if (usedPhrases?.has(selectedPhrase)) {
    selectedPhrase = getAlternateFromPool(pool, selectedPhrase, usedPhrases);
  }
  
  return selectedPhrase;
}

function getAlternateFromPool(pool: string[], excluded: string, usedPhrases: Set<string>): string {
  for (const phrase of pool) {
    if (phrase !== excluded && !usedPhrases.has(phrase)) {
      return phrase;
    }
  }
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
