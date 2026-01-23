import React from 'react';
import { cn } from '@/lib/utils';
import type { DivisionSlug } from '@/types/championship';

interface StatusRingProps {
  divisionSlug: DivisionSlug;
  divisionColor: string;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const RING_SIZE_MAP = {
  sm: 'ring-2',
  md: 'ring-[3px]',
  lg: 'ring-4',
};

/**
 * StatusRing - A ring around content that shows division color.
 * Used for avatars and other circular elements to indicate division tier.
 */
export function StatusRing({ 
  divisionSlug, 
  divisionColor, 
  size = 'md', 
  children, 
  className 
}: StatusRingProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        SIZE_MAP[size],
        RING_SIZE_MAP[size],
        className
      )}
      style={{ 
        boxShadow: `0 0 0 ${size === 'sm' ? '2px' : size === 'md' ? '3px' : '4px'} ${divisionColor}`,
      }}
    >
      {children}
    </div>
  );
}
