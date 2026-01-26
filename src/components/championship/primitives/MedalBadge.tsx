import React from 'react';
import { cn } from '@/lib/utils';

interface MedalBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Modern Country Club palette for medals
const MEDAL_CONFIG: Record<number, {
  emoji: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}> = {
  1: {
    emoji: '🥇',
    bgClass: 'bg-[#C1A84C]', // Golf Chartreus gold
    borderClass: 'border-[#A89040]',
    textClass: 'text-white',
  },
  2: {
    emoji: '🥈',
    bgClass: 'bg-[#B8C6C9]', // Golf Sky Blue silver
    borderClass: 'border-[#9AABAF]',
    textClass: 'text-white',
  },
  3: {
    emoji: '🥉',
    bgClass: 'bg-[#8B7355]', // Warm bronze
    borderClass: 'border-[#6D5A42]',
    textClass: 'text-white',
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
          'flex items-center justify-center rounded-full font-bold',
          SIZE_CLASSES[size],
          config.bgClass,
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
