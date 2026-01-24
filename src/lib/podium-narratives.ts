/**
 * Podium Narrative Logic
 * Generates contextual one-line narratives for podium positions
 */

interface SeasonalNarrativeParams {
  division: string;
  streakDays: number;
  coursesToPromotion: number;
  isInPromotionZone: boolean;
}

interface AllTimeNarrativeParams {
  seasonsWon: number;
  podiumFinishes: number;
}

/**
 * Generate narrative text for seasonal podium positions
 * Rules:
 * - Max 1 line
 * - No emojis
 * - No exclamation marks
 * - Calm, confident tone
 */
export function getSeasonalNarrative(
  position: 1 | 2 | 3,
  params: SeasonalNarrativeParams
): string {
  const { division, streakDays, coursesToPromotion, isInPromotionZone } = params;

  // Position 1 narratives
  if (position === 1) {
    if (streakDays >= 3) {
      return `On a ${streakDays}-course run`;
    }
    return `Leading ${division}`;
  }

  // Position 2 & 3 narratives
  if (isInPromotionZone) {
    return 'Holding promotion spot';
  }

  if (coursesToPromotion <= 2 && coursesToPromotion > 0) {
    return `${coursesToPromotion} course${coursesToPromotion !== 1 ? 's' : ''} from promotion`;
  }

  return 'Holding podium spot';
}

/**
 * Generate narrative text for all-time Hall of Fame podium positions
 * Rules:
 * - NEVER use time-based language ("this week", "recently")
 * - NEVER use momentum language ("climbing", "rising")
 * - Calm, archival, respectful tone
 */
export function getAllTimeNarrative(
  position: 1 | 2 | 3,
  params: AllTimeNarrativeParams
): string {
  const { seasonsWon, podiumFinishes } = params;

  // Position 1 narratives
  if (position === 1) {
    if (seasonsWon > 0) {
      return `All-time leader · ${seasonsWon} season${seasonsWon !== 1 ? 's' : ''} won`;
    }
    return 'All-time leader';
  }

  // Position 2 & 3 narratives
  if (seasonsWon > 0) {
    return `${seasonsWon}x Season Champion`;
  }

  if (podiumFinishes > 0) {
    return 'Hall of Fame member';
  }

  return 'Most courses logged';
}

/**
 * Fallback narrative when no specific context is available
 */
export function getDefaultNarrative(position: 1 | 2 | 3, mode: 'seasonal' | 'all_time'): string {
  if (mode === 'seasonal') {
    switch (position) {
      case 1:
        return 'Leading this season';
      case 2:
      case 3:
        return 'Holding podium spot';
    }
  }

  // All-time mode
  switch (position) {
    case 1:
      return 'All-time leader';
    case 2:
    case 3:
      return 'Hall of Fame member';
  }
}
