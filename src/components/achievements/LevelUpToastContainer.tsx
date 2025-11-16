import React from 'react';
import { useLevelUpDetection } from '@/hooks/useLevelUpDetection';
import { LevelUpToast } from './LevelUpToast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface LevelUpToastContainerProps {
  onShare: (data: any) => void;
}

export const LevelUpToastContainer: React.FC<LevelUpToastContainerProps> = ({ onShare }) => {
  const { user } = useSupabaseSession();
  const { levelUpData, dismissLevelUp } = useLevelUpDetection(user?.id);

  return (
    <LevelUpToast
      levelUpData={levelUpData}
      onDismiss={dismissLevelUp}
      onShare={onShare}
    />
  );
};
