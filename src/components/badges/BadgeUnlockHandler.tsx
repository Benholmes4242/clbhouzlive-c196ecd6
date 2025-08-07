import React, { useEffect } from 'react';
import { useBadges } from '@/hooks/useBadges';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

// Component to handle badge unlock modal display
export const BadgeUnlockHandler: React.FC = () => {
  const { user } = useSupabaseSession();
  const { 
    unlockedBadge, 
    showUnlockModal, 
    setShowUnlockModal,
    BadgeUnlockModal 
  } = useBadges(user?.id);

  // Don't render anything if modal component isn't loaded yet
  if (!BadgeUnlockModal) return null;

  return (
    <BadgeUnlockModal
      isOpen={showUnlockModal}
      onClose={() => setShowUnlockModal(false)}
      badge={unlockedBadge}
      xpGained={100}
    />
  );
};