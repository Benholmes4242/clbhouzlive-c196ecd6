import { useEffect, useState } from 'react';
import { useUserXPOverview } from './useUserXPOverview';

const STORAGE_KEY = 'clbhouz_user_level';

interface LevelUpData {
  newLevel: string;
  totalXP: number;
  previousLevel: string;
}

export function useLevelUpDetection(userId?: string) {
  const xpOverview = useUserXPOverview(userId);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  useEffect(() => {
    if (!userId || !xpOverview) return;

    const storageKey = `${STORAGE_KEY}_${userId}`;
    const storedLevel = localStorage.getItem(storageKey);
    const currentLevel = xpOverview.currentLevel;

    // If level has changed and we have a previous level stored
    if (storedLevel && storedLevel !== currentLevel) {
      setLevelUpData({
        newLevel: currentLevel,
        totalXP: xpOverview.totalXP,
        previousLevel: storedLevel,
      });
    }

    // Update stored level
    localStorage.setItem(storageKey, currentLevel);
  }, [userId, xpOverview]);

  const dismissLevelUp = () => {
    setLevelUpData(null);
  };

  return {
    levelUpData,
    dismissLevelUp,
  };
}
