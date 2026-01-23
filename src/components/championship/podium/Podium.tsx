import React from 'react';
import { PodiumProps } from '@/types/podium';
import { SeasonalPodium } from './SeasonalPodium';
import { HallOfFamePodium } from './HallOfFamePodium';

/**
 * Unified Podium Component
 * 
 * Displays the top 3 users in either Seasonal (live competition) or 
 * All-Time (Hall of Fame) mode. Never shown for 'nearby' scope.
 */
export const Podium: React.FC<PodiumProps> = ({
  mode,
  scope,
  divisionId,
  currentUserId,
  onUserClick,
}) => {
  // Never show podium for 'nearby' scope
  if (scope === 'nearby') {
    return null;
  }

  if (mode === 'seasonal') {
    return (
      <SeasonalPodium
        scope={scope}
        divisionId={divisionId}
        currentUserId={currentUserId}
        onUserClick={onUserClick}
      />
    );
  }

  return (
    <HallOfFamePodium
      scope={scope}
      currentUserId={currentUserId}
      onUserClick={onUserClick}
    />
  );
};
