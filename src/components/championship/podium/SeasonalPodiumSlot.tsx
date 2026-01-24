import React from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SeasonalPodiumEntry } from '@/types/podium';

interface SeasonalPodiumSlotProps {
  entry: SeasonalPodiumEntry | undefined;
  isFirst?: boolean;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

const ringColors: Record<1 | 2 | 3, string> = {
  1: 'ring-amber-400',      // Gold
  2: 'ring-slate-300',      // Silver
  3: 'ring-orange-300',     // Bronze
};

const statColors: Record<1 | 2 | 3, string> = {
  1: 'text-amber-600 dark:text-amber-500',
  2: 'text-slate-600 dark:text-slate-400',
  3: 'text-orange-600 dark:text-orange-500',
};

const badgeColors: Record<1 | 2 | 3, string> = {
  1: 'bg-amber-500',
  2: 'bg-slate-400',
  3: 'bg-orange-400',
};

/**
 * SeasonalPodiumSlot - Individual podium slot for seasonal (broadcast) mode
 * 
 * Features:
 * - Circular avatar with position-colored ring
 * - Position badge above avatar
 * - Elevated first place with subtle pulse animation
 * - "New leader" / "New entry" labels when applicable
 * - NO cards or boxes - clean broadcast aesthetic
 */
export const SeasonalPodiumSlot: React.FC<SeasonalPodiumSlotProps> = ({
  entry,
  isFirst = false,
  isCurrentUser = false,
  onClick,
}) => {
  // Empty slot placeholder
  if (!entry) {
    return <div className="w-24" />;
  }

  const position = entry.podium_position as 1 | 2 | 3;
  const isNewLeader = (entry as any).is_new_leader === true;
  const isNewPodiumEntry = (entry as any).is_new_podium_entry === true;

  return (
    <div
      className={cn(
        'flex flex-col items-center cursor-pointer transition-transform hover:scale-105',
        isFirst && '-mt-6' // Elevate first place
      )}
      onClick={onClick}
    >
      {/* Position badge - squircle shape */}
      <div
        className={cn(
          'mb-2 flex items-center justify-center text-xs font-bold text-white',
          badgeColors[position]
        )}
        style={{
          width: '24px',
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
        }}
      >
        {position}
      </div>

      {/* Avatar with squircle ring */}
      <div className="relative">
        <SquircleAvatar
          size={isFirst ? 80 : 64}
          src={entry.avatar_url}
          alt={entry.display_name || entry.username}
          fallback={entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?'}
          ringColor={
            position === 1 ? '#FBBF24' : 
            position === 2 ? '#94A3B8' : 
            '#FDBA74'
          }
          className={cn(
            isCurrentUser && 'ring-offset-2 ring-offset-primary'
          )}
        />

        {/* New leader / New podium entry label */}
        {(isNewLeader || isNewPodiumEntry) && (
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-medium rounded-full animate-fade-in">
            {isNewLeader ? 'New leader' : 'New entry'}
          </div>
        )}
      </div>

      {/* Name */}
      <p
        className={cn(
          'mt-2 font-semibold text-center truncate max-w-[90px] text-foreground',
          isFirst ? 'text-sm' : 'text-xs'
        )}
      >
        {entry.display_name || entry.username}
      </p>

      {/* Courses stat */}
      <p
        className={cn(
          'font-bold',
          isFirst ? 'text-lg' : 'text-base',
          statColors[position]
        )}
      >
        {entry.courses_logged}
        <span className="text-xs font-normal text-muted-foreground ml-1">courses</span>
      </p>

      {/* Narrative */}
      {entry.narrative_text && (
        <p className="text-[10px] text-muted-foreground text-center max-w-[90px] leading-tight">
          {entry.narrative_text}
        </p>
      )}
    </div>
  );
};
