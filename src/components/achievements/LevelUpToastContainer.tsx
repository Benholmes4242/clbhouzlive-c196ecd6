import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface LevelUpToastContainerProps {
  onShare: (data: any) => void;
}

// XP system disabled - this component is no longer active
export const LevelUpToastContainer: React.FC<LevelUpToastContainerProps> = ({ onShare }) => {
  return null;
};
