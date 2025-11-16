// Season-specific level labels (separate from global XP rings)
export interface SeasonLevel {
  name: string;
  minXP: number;
  maxXP: number;
}

export const SEASON_LEVELS: SeasonLevel[] = [
  { name: 'Season Rookie', minXP: 0, maxXP: 499 },
  { name: 'Season Regular', minXP: 500, maxXP: 1499 },
  { name: 'Season Grinder', minXP: 1500, maxXP: 2999 },
  { name: 'Season Ace', minXP: 3000, maxXP: Infinity },
];

export function getSeasonLevel(xp: number): string {
  const level = SEASON_LEVELS.find((l) => xp >= l.minXP && xp <= l.maxXP);
  return level?.name || 'Season Rookie';
}

export function getSeasonProgress(xp: number): { current: number; next: number; percent: number } | null {
  const currentLevel = SEASON_LEVELS.find((l) => xp >= l.minXP && xp <= l.maxXP);
  if (!currentLevel) return null;

  const currentIndex = SEASON_LEVELS.indexOf(currentLevel);
  const nextLevel = SEASON_LEVELS[currentIndex + 1];

  if (!nextLevel) {
    // Max level reached
    return null;
  }

  const progressInBand = xp - currentLevel.minXP;
  const bandSize = nextLevel.minXP - currentLevel.minXP;
  const percent = (progressInBand / bandSize) * 100;

  return {
    current: xp,
    next: nextLevel.minXP,
    percent: Math.min(100, percent),
  };
}
