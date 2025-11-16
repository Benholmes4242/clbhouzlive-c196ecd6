import React from 'react';
import { useAchievementToasts, AchievementToastData } from '@/hooks/useAchievementToasts';
import { AchievementToast } from './AchievementToast';

interface AchievementToastContainerProps {
  onShare: (achievement: AchievementToastData) => void;
}

export const AchievementToastContainer: React.FC<AchievementToastContainerProps> = ({ onShare }) => {
  const { currentToast, dismissToast } = useAchievementToasts();

  return (
    <AchievementToast
      achievement={currentToast}
      onDismiss={dismissToast}
      onShare={onShare}
    />
  );
};
