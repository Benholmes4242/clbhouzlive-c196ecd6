import React from 'react';
import { PodiumCard } from './PodiumCard';
import { PodiumEntry, PodiumMode } from '@/types/podium';

interface PodiumLayoutProps {
  entries: PodiumEntry[];
  mode: PodiumMode;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
}

export const PodiumLayout: React.FC<PodiumLayoutProps> = ({
  entries,
  mode,
  currentUserId,
  onUserClick,
}) => {
  // Need at least 1 entry to show podium
  if (entries.length === 0) {
    return null;
  }

  const first = entries.find((e) => e.podium_position === 1);
  const second = entries.find((e) => e.podium_position === 2);
  const third = entries.find((e) => e.podium_position === 3);

  return (
    <div className="w-full py-6">
      <div className="flex items-end justify-center gap-3 max-w-lg mx-auto px-4">
        {/* 2nd Place - Left */}
        <div className="flex-1 max-w-[140px]">
          {second && (
            <PodiumCard
              entry={second}
              mode={mode}
              isCurrentUser={second.user_id === currentUserId}
              onClick={() => onUserClick?.(second.user_id)}
            />
          )}
        </div>

        {/* 1st Place - Center (elevated) */}
        <div className="flex-1 max-w-[160px] -mt-4">
          {first && (
            <PodiumCard
              entry={first}
              mode={mode}
              isFirst
              isCurrentUser={first.user_id === currentUserId}
              onClick={() => onUserClick?.(first.user_id)}
            />
          )}
        </div>

        {/* 3rd Place - Right */}
        <div className="flex-1 max-w-[140px]">
          {third && (
            <PodiumCard
              entry={third}
              mode={mode}
              isCurrentUser={third.user_id === currentUserId}
              onClick={() => onUserClick?.(third.user_id)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
