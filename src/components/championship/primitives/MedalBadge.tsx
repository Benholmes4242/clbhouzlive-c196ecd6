import React from 'react';
import { cn } from '@/lib/utils';

interface MedalBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MEDAL_CONFIG: Record<number, {
  emoji: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}> = {
  1: {
    emoji: '🥇',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
    borderClass: 'border-amber-300 dark:border-amber-600',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  2: {
    emoji: '🥈',
    bgClass: 'bg-slate-100 dark:bg-slate-800/50',
    borderClass: 'border-slate-300 dark:border-slate-600',
    textClass: 'text-slate-600 dark:text-slate-300',
  },
  3: {
    emoji: '🥉',
    bgClass: 'bg-orange-50 dark:bg-orange-950/50',
    borderClass: 'border-orange-300 dark:border-orange-600',
    textClass: 'text-orange-700 dark:text-orange-300',
  },
};

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

/**
 * MedalBadge - Shows medal for top 3 positions, or rank number for others.
 */
export function MedalBadge({ rank, size = 'md', className }: MedalBadgeProps) {
  const isMedal = rank >= 1 && rank <= 3;
  const config = MEDAL_CONFIG[rank];

  if (isMedal && config) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border font-bold',
          SIZE_CLASSES[size],
          config.bgClass,
          config.borderClass,
          config.textClass,
          className
        )}
      >
        <span className="leading-none">{rank}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground font-medium',
        SIZE_CLASSES[size],
        className
      )}
    >
      <span className="leading-none">#{rank}</span>
    </div>
  );
}
