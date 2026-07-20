import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AchievementToastData } from './useAchievementToasts';
import type { UserAchievement } from './useUserAchievements';

export function useAchievementSharing() {
  const navigate = useNavigate();
  const [achievementToShare, setAchievementToShare] = useState<{
    achievementId?: string;
    name: string;
    description: string;
    category?: string;
    points?: number;
    type?: 'achievement' | 'level_up';
    levelName?: string;
    totalXP?: number;
    levelColor?: string;
  } | null>(null);

  const prepareAchievementShare = useCallback((achievement: AchievementToastData | UserAchievement | any) => {
    let achievementData;

    // Check if this is a level-up share
    if (achievement.type === 'level_up') {
      achievementData = {
        type: 'level_up',
        levelName: achievement.levelName,
        totalXP: achievement.totalXP,
        levelColor: achievement.levelColor,
        name: `Level Up: ${achievement.levelName}`,
        description: `Just reached ${achievement.levelName}!`,
      };
    } else {
      // Regular achievement share
      achievementData = {
        type: 'achievement',
        achievementId: achievement.achievementId,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        points: achievement.points,
      };
    }

    // Store in sessionStorage so it persists across navigation
    sessionStorage.setItem('pendingAchievementShare', JSON.stringify(achievementData));
    
    // Navigate to home with a special flag
    navigate('/?shareAchievement=true');
  }, [navigate]);

  const getStoredAchievement = useCallback(() => {
    const stored = sessionStorage.getItem('pendingAchievementShare');
    if (stored) {
      sessionStorage.removeItem('pendingAchievementShare');
      return JSON.parse(stored);
    }
    return null;
  }, []);

  return {
    prepareAchievementShare,
    getStoredAchievement,
  };
}
