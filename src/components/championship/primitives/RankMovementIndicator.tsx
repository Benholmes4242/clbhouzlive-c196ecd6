import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { MovementDirection } from '@/types/championship';
import { getMovementDirection } from '@/types/championship';

interface RankMovementIndicatorProps {
  movement: number;
  period?: 'daily' | 'weekly';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-xs gap-0.5',
  md: 'text-sm gap-1',
  lg: 'text-base gap-1',
};

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
};

const DIRECTION_STYLES: Record<MovementDirection, { 
  icon: typeof ArrowUp; 
  colorClass: string; 
  bgClass: string;
}> = {
  up: { 
    icon: ArrowUp, 
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  down: { 
    icon: ArrowDown, 
    colorClass: 'text-red-500 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/50',
  },
  stable: { 
    icon: Minus, 
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30',
  },
};

/**
 * RankMovementIndicator - Shows rank movement with icon and optional label.
 * Positive = climbed (green arrow up), Negative = dropped (red arrow down)
 */
export function RankMovementIndicator({ 
  movement, 
  period = 'daily',
  size = 'md', 
  showLabel = true,
  className 
}: RankMovementIndicatorProps) {
  const direction = getMovementDirection(movement);
  const { icon: Icon, colorClass, bgClass } = DIRECTION_STYLES[direction];
  
  const absMovement = Math.abs(movement);
  const label = direction === 'stable' ? '—' : `${absMovement}`;

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-full px-1.5 py-0.5',
        SIZE_CLASSES[size],
        colorClass,
        bgClass,
        className
      )}
      title={`${direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'} ${period}`}
    >
      <Icon size={ICON_SIZES[size]} strokeWidth={2.5} />
      {showLabel && <span>{label}</span>}
    </div>
  );
}
