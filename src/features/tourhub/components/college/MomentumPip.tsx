/**
 * MomentumPip - Light gamification indicator for form/trend
 * Adds "form" feeling without requiring new data
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Flame, Minus } from 'lucide-react';

export type MomentumType = 'neutral' | 'up' | 'down' | 'fire';

interface MomentumPipProps {
  type: MomentumType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const momentumConfig: Record<MomentumType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  neutral: {
    icon: Minus,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    label: 'Steady',
  },
  up: {
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: 'Rising',
  },
  down: {
    icon: TrendingDown,
    color: 'text-rose-500 dark:text-rose-400',
    bgColor: 'bg-rose-500/10',
    label: 'Falling',
  },
  fire: {
    icon: Flame,
    color: 'text-brand-orange',
    bgColor: 'bg-brand-orange/10',
    label: 'On Fire',
  },
};

export const MomentumPip: React.FC<MomentumPipProps> = ({
  type,
  size = 'sm',
  showLabel = false,
  className,
}) => {
  const config = momentumConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-sq-pill',
        config.bgColor,
        size === 'sm' && 'px-1.5 py-0.5',
        size === 'md' && 'px-2 py-1',
        className
      )}
    >
      <Icon className={cn(
        config.color,
        size === 'sm' && 'w-3 h-3',
        size === 'md' && 'w-3.5 h-3.5',
      )} />
      
      {showLabel && (
        <span className={cn(
          'font-medium',
          config.color,
          size === 'sm' && 'text-[10px]',
          size === 'md' && 'text-xs',
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default MomentumPip;
