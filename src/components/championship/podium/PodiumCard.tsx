import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PodiumEntry, PodiumMode, SeasonalPodiumEntry, AllTimePodiumEntry } from '@/types/podium';
import { PodiumNarrative } from './PodiumNarrative';

interface PodiumCardProps {
  entry: PodiumEntry;
  mode: PodiumMode;
  isFirst?: boolean;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

const positionColors = {
  1: 'from-amber-400 to-amber-500', // Gold
  2: 'from-slate-300 to-slate-400', // Silver
  3: 'from-orange-400 to-orange-500', // Bronze
} as const;

const positionBadges = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
} as const;

export const PodiumCard: React.FC<PodiumCardProps> = ({
  entry,
  mode,
  isFirst = false,
  isCurrentUser = false,
  onClick,
}) => {
  const isSeasonal = mode === 'seasonal';
  const seasonalEntry = entry as SeasonalPodiumEntry;
  const allTimeEntry = entry as AllTimePodiumEntry;
  const position = entry.podium_position as 1 | 2 | 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl bg-card border transition-all cursor-pointer hover:scale-[1.02]',
        isFirst && 'shadow-lg',
        isFirst && isSeasonal && 'animate-podium-glow',
        isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        !isSeasonal && 'shadow-md'
      )}
    >
      {/* Position Badge */}
      <div
        className={cn(
          'absolute -top-3 left-1/2 -translate-x-1/2',
          'w-8 h-8 rounded-full flex items-center justify-center',
          'bg-gradient-to-b shadow-sm text-lg',
          positionColors[position]
        )}
      >
        {positionBadges[position]}
      </div>

      {/* Avatar */}
      <Avatar
        className={cn(
          'mt-2 border-2 border-background shadow',
          isFirst ? 'w-16 h-16' : 'w-14 h-14'
        )}
      >
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback className="bg-muted">
          {entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p
        className={cn(
          'mt-2 font-semibold text-center truncate w-full text-foreground',
          isFirst ? 'text-sm' : 'text-xs'
        )}
      >
        {entry.display_name || entry.username}
      </p>

      {/* Primary Stat */}
      <p className={cn('font-bold text-primary', isFirst ? 'text-lg' : 'text-base')}>
        {isSeasonal ? seasonalEntry.courses_logged : allTimeEntry.all_time_courses}
        <span className="text-xs font-normal text-muted-foreground ml-1">courses</span>
      </p>

      {/* Narrative */}
      {entry.narrative_text && (
        <PodiumNarrative text={entry.narrative_text} mode={mode} isFirst={isFirst} />
      )}
    </div>
  );
};
