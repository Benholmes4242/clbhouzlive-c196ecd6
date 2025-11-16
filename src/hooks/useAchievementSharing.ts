import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AchievementToastData } from './useAchievementToasts';
import type { UserAchievement } from './useUserAchievements';

export function useAchievementSharing() {
  const navigate = useNavigate();
  const [achievementToShare, setAchievementToShare] = useState<{
    achievementId: string;
    name: string;
    description: string;
    category: string;
    points: number;
  } | null>(null);

  const prepareAchievementShare = useCallback((achievement: AchievementToastData | UserAchievement) => {
    const achievementData = {
      achievementId: achievement.achievementId,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      points: achievement.points,
    };

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
