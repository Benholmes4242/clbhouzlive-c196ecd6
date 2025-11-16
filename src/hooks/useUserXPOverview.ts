import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';

export interface XPLevel {
  name: string;
  color: string;
  minXP: number;
  maxXP: number;
}

export const XP_LEVELS: XPLevel[] = [
  { name: 'Bronze', color: '#CD7F32', minXP: 0, maxXP: 9999 },
  { name: 'Blue', color: '#4A90E2', minXP: 10000, maxXP: 19999 },
  { name: 'Green', color: '#6e9277', minXP: 20000, maxXP: 29999 },
  { name: 'Silver', color: '#C0C0C0', minXP: 30000, maxXP: 39999 },
  { name: 'Gold', color: '#FFD700', minXP: 40000, maxXP: Infinity },
];

export interface XPOverview {
  totalXP: number;
  currentLevel: string;
  currentLevelColor: string;
  nextLevel?: {
    name: string;
    requiredXP: number;
    remainingXP: number;
    progressPercent: number;
  };
}

export function useUserXPOverview(userId?: string): XPOverview | null {
  const { data: achievements, isLoading } = useUserAchievements(userId);

  return useMemo(() => {
    if (isLoading || !achievements) return null;

    // Calculate total XP from unlocked achievements
    const totalXP = achievements
      .filter((a) => a.isUnlocked)
      .reduce((sum, a) => sum + a.points, 0);

    // Find current level
    const currentLevelData = XP_LEVELS.find(
      (level) => totalXP >= level.minXP && totalXP <= level.maxXP
    ) || XP_LEVELS[0];

    // Find next level
    const currentLevelIndex = XP_LEVELS.indexOf(currentLevelData);
    const nextLevelData = XP_LEVELS[currentLevelIndex + 1];

    let nextLevel = undefined;
    if (nextLevelData) {
      const requiredXP = nextLevelData.minXP;
      const remainingXP = requiredXP - totalXP;
      const progressInCurrentBand = totalXP - currentLevelData.minXP;
      const totalBandSize = requiredXP - currentLevelData.minXP;
      const progressPercent = Math.min(100, (progressInCurrentBand / totalBandSize) * 100);

      nextLevel = {
        name: nextLevelData.name,
        requiredXP,
        remainingXP,
        progressPercent,
      };
    }

    return {
      totalXP,
      currentLevel: currentLevelData.name,
      currentLevelColor: currentLevelData.color,
      nextLevel,
    };
  }, [achievements, isLoading]);
}
