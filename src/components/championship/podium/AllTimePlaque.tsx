import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AllTimePodiumEntry } from '@/types/podium';

interface AllTimePlaqueProps {
  entry: AllTimePodiumEntry;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

const plaqueColors: Record<1 | 2 | 3, string> = {
  1: 'bg-gradient-to-b from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-950/20 dark:to-amber-900/10 dark:border-amber-800/30',
  2: 'bg-gradient-to-b from-slate-50 to-slate-100/50 border-slate-200 dark:from-slate-900/30 dark:to-slate-800/20 dark:border-slate-700/30',
  3: 'bg-gradient-to-b from-orange-50 to-orange-100/50 border-orange-200 dark:from-orange-950/20 dark:to-orange-900/10 dark:border-orange-800/30',
};

const medallionColors: Record<1 | 2 | 3, string> = {
  1: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-700',
  2: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600',
  3: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-400 dark:border-orange-700',
};

/**
 * AllTimePlaque - Individual plaque for all-time Hall of Fame mode
 * 
 * Features:
 * - Rectangular plaque with muted position-themed gradient
 * - NO animation whatsoever - stillness conveys permanence
 * - Equal visual weight for all positions
 * - Legacy-focused narrative (seasons won, podium finishes)
 */
export const AllTimePlaque: React.FC<AllTimePlaqueProps> = ({
  entry,
  isCurrentUser = false,
  onClick,
}) => {
  const position = entry.podium_position as 1 | 2 | 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center p-4 rounded-xl border transition-colors cursor-pointer',
        plaqueColors[position],
        isCurrentUser && 'ring-2 ring-primary ring-offset-2',
        'hover:shadow-sm' // Very subtle hover, no transform per spec
      )}
    >
      {/* Medallion */}
      <div
        className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold mb-3',
          medallionColors[position]
        )}
      >
        {position}
      </div>

      {/* Avatar - no ring, no animation */}
      <Avatar className="w-14 h-14 border-2 border-white dark:border-slate-800 shadow-sm">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback>
          {entry.display_name?.charAt(0) || entry.username?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="mt-2 font-semibold text-sm text-center truncate max-w-full text-foreground">
        {entry.display_name || entry.username}
      </p>

      {/* All-time courses */}
      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
        {entry.all_time_courses}
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">courses</span>
      </p>

      {/* Legacy narrative */}
      {entry.narrative_text && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight mt-1">
          {entry.narrative_text}
        </p>
      )}
    </div>
  );
};
