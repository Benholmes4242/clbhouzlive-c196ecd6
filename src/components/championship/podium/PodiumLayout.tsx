import React from 'react';
import { cn } from '@/lib/utils';
import { PodiumEntry, PodiumMode, SeasonalPodiumEntry, AllTimePodiumEntry } from '@/types/podium';
import { SeasonalPodiumSlot } from './SeasonalPodiumSlot';
import { AllTimePlaque } from './AllTimePlaque';

interface PodiumLayoutProps {
  entries: PodiumEntry[];
  mode: PodiumMode;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

/**
 * PodiumLayout - Unified layout with two visual treatments:
 * 
 * SEASONAL MODE (Broadcast Podium):
 * - Circular avatars in true podium silhouette
 * - #1 center and elevated, #2 left, #3 right (both lower)
 * - NO individual cards or boxes
 * - ONE shared, soft base shadow beneath the trio
 * - Subtle pulse animation on #1 only
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
  currentUserId,
  onUserClick,
}) => {
  if (entries.length === 0) return null;

  const first = entries.find((e) => e.podium_position === 1);
  const second = entries.find((e) => e.podium_position === 2);
  const third = entries.find((e) => e.podium_position === 3);

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

  // SEASONAL MODE: Broadcast podium silhouette
  return (
    <div className="w-full py-6">
      {/* Shared soft shadow beneath entire podium */}
      <div 
        className="relative max-w-sm mx-auto"
        style={{
          filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.08))',
        }}
      >
        {/* Podium Layout: 2nd - 1st (elevated) - 3rd */}
        <div className="flex items-end justify-center gap-4">
          {/* 2nd Place - Left */}
          <SeasonalPodiumSlot
            entry={second as SeasonalPodiumEntry | undefined}
            isCurrentUser={second?.user_id === currentUserId}
            onClick={() => second && onUserClick?.(second.user_id)}
          />

          {/* 1st Place - Center (elevated) */}
          <SeasonalPodiumSlot
            entry={first as SeasonalPodiumEntry | undefined}
            isFirst
            isCurrentUser={first?.user_id === currentUserId}
            onClick={() => first && onUserClick?.(first.user_id)}
          />

          {/* 3rd Place - Right */}
          <SeasonalPodiumSlot
            entry={third as SeasonalPodiumEntry | undefined}
            isCurrentUser={third?.user_id === currentUserId}
            onClick={() => third && onUserClick?.(third.user_id)}
          />
        </div>
      </div>
    </div>
  );
};
