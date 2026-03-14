import React from 'react';
import { cn } from '@/lib/utils';

interface MedalBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-5 h-5 text-[10px]',
  md: 'w-[22px] h-[22px] text-[10px]',
  lg: 'w-8 h-8 text-sm',
};

// Gold uses accent-amber CSS var; silver (#A8B4C0) and bronze (#C4956A) are decorative — no semantic var available
const MEDAL_COLORS: Record<number, string> = {
  1: 'hsl(var(--accent-amber))',
  2: '#A8B4C0',
  3: '#C4956A',
};

/**
 * MedalBadge - Shows medal for top 3 positions, or rank number for others.
 */
export function MedalBadge({ rank, size = 'md', className }: MedalBadgeProps) {
  const isMedal = rank >= 1 && rank <= 3;

  if (isMedal) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-bold',
          SIZE_CLASSES[size],
          className
        )}
        style={{ backgroundColor: MEDAL_COLORS[rank], color: 'white' }}
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
