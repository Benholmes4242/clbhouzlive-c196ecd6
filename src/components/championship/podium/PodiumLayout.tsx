import React from 'react';
import { PodiumEntry, PodiumMode, SeasonalPodiumEntry, AllTimePodiumEntry } from '@/types/podium';
import { TrophyPodium } from './TrophyPodium';
import { AllTimePlaque } from './AllTimePlaque';

interface PodiumLayoutProps {
  entries: PodiumEntry[];
  mode: PodiumMode;
  seasonThemeColor?: string;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

/**
 * PodiumLayout - Unified layout with two visual treatments:
 * 
 * SEASONAL MODE (Trophy Podium):
 * - Premium podium ceremony design
 * - Crown and glow for 1st place
 * - Metallic borders (gold, silver, bronze)
 * - Platform heights for visual depth
 * - Season theme color integration
 * 
 * ALL-TIME MODE (Hall of Fame):
 * - Rectangular plaques with EQUAL visual weight
 * - NO elevation differences
 * - NO motion whatsoever
 * - Flat, museum-like appearance
 */
export const PodiumLayout: React.FC<PodiumLayoutProps> = ({
  entries,
  mode,
  seasonThemeColor = '#22c55e',
  currentUserId,
  onUserClick,
}) => {
  if (entries.length === 0) return null;

  // ALL-TIME MODE: Hall of Fame plaques
  if (mode === 'all_time') {
    const sortedEntries = [...entries].sort((a, b) => a.podium_position - b.podium_position);
    
    return (
      <div className="w-full py-6">
        {/* Three equal plaques - horizontal layout */}
        <div className="flex justify-center gap-3 max-w-md mx-auto px-4">
          {sortedEntries.map((entry) => (
            <AllTimePlaque
              key={entry.user_id}
              entry={entry as AllTimePodiumEntry}
              isCurrentUser={entry.user_id === currentUserId}
              onClick={() => onUserClick?.(entry.user_id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // SEASONAL MODE: Trophy Podium
  return (
    <TrophyPodium
      entries={entries as SeasonalPodiumEntry[]}
      seasonThemeColor={seasonThemeColor}
      currentUserId={currentUserId}
      onUserClick={onUserClick}
    />
  );
};
