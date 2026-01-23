import React from 'react';
import { cn } from '@/lib/utils';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

type MomentumType = 'hot' | 'rising' | 'cooling' | 'neutral';

interface RivalMomentumBadgeProps {
  timesOvertaken: number;
  timesBeenOvertaken: number;
  size?: 'sm' | 'md';
  className?: string;
}

function getMomentumType(overtaken: number, beenOvertaken: number): MomentumType {
  const netMomentum = overtaken - beenOvertaken;
  
  if (overtaken >= 3 && netMomentum > 0) return 'hot';
  if (netMomentum > 0) return 'rising';
  if (netMomentum < 0) return 'cooling';
  return 'neutral';
}

const MOMENTUM_CONFIG: Record<MomentumType, {
  icon: typeof Zap;
  label: string;
  colorClass: string;
  bgClass: string;
}> = {
  hot: {
    icon: Zap,
    label: 'Hot rivalry',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/50',
  },
  rising: {
    icon: TrendingUp,
    label: 'You are gaining',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  cooling: {
    icon: TrendingDown,
    label: 'They are catching up',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
  },
  neutral: {
    icon: Zap,
    label: 'Even match',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
};

const ICON_SIZES = {
  sm: 12,
  md: 14,
};

/**
 * RivalMomentumBadge - Shows rivalry momentum based on overtakes.
 */
export function RivalMomentumBadge({ 
  timesOvertaken, 
  timesBeenOvertaken, 
  size = 'md',
  className 
}: RivalMomentumBadgeProps) {
  const momentumType = getMomentumType(timesOvertaken, timesBeenOvertaken);
  const config = MOMENTUM_CONFIG[momentumType];
  const Icon = config.icon;

  // Don't show for neutral with no interactions
  if (momentumType === 'neutral' && timesOvertaken === 0 && timesBeenOvertaken === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        SIZE_CLASSES[size],
        config.colorClass,
        config.bgClass,
        className
      )}
      title={`Overtaken them ${timesOvertaken}x, been overtaken ${timesBeenOvertaken}x`}
    >
      <Icon size={ICON_SIZES[size]} strokeWidth={2} />
      <span>{config.label}</span>
    </div>
  );
}
