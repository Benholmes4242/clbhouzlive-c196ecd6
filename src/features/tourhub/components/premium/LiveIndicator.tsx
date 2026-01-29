import React from 'react';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

/**
 * Animated live indicator with pulsing dot
 */
export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  className,
  size = 'md',
  label = 'LIVE',
  showLabel = true,
}) => {
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('relative flex', dotSizes[size])}>
        {/* Ping animation */}
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            'bg-[var(--th-accent-live)]'
          )}
        />
        {/* Solid dot */}
        <span
          className={cn(
            'relative inline-flex rounded-full',
            'bg-[var(--th-accent-live)]',
            dotSizes[size]
          )}
        />
      </span>
      {showLabel && (
        <span
          className={cn(
            'font-bold text-white tracking-wider',
            textSizes[size]
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
};
