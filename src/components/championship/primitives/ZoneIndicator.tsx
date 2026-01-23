import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import type { ZoneType } from '@/types/championship';

interface ZoneIndicatorProps {
  zone: ZoneType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ZONE_CONFIG: Record<NonNullable<ZoneType>, {
  icon: typeof TrendingUp;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  promotion: {
    icon: TrendingUp,
    label: 'Promotion Zone',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  safe: {
    icon: Shield,
    label: 'Safe Zone',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted/30',
    borderClass: 'border-muted',
  },
  relegation: {
    icon: TrendingDown,
    label: 'Relegation Zone',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
    borderClass: 'border-amber-200 dark:border-amber-800',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-2.5 py-1.5 gap-2',
};

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
};

/**
 * ZoneIndicator - Shows promotion/safe/relegation zone status with icon.
 */
export function ZoneIndicator({ 
  zone, 
  size = 'md', 
  showLabel = true,
  className 
}: ZoneIndicatorProps) {
  if (!zone) return null;
  
  const config = ZONE_CONFIG[zone];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        SIZE_CLASSES[size],
        config.colorClass,
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <Icon size={ICON_SIZES[size]} strokeWidth={2} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
