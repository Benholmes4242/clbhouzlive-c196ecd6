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

/**
 * Squircle size map - matches SquircleAvatar sizing
 * Uses 34% border-radius and 1/1.05 aspect ratio
 */
const SIZE_MAP = {
  sm: 40,
  md: 48,
  lg: 64,
};

const RING_THICKNESS_MAP = {
  sm: 2,
  md: 3,
  lg: 4,
};

/**
 * StatusRing - A squircle ring around content that shows division color.
 * 
 * Uses the same squircle shape as SquircleAvatar:
 * - Border radius: 34%
 * - Aspect ratio: 1 / 1.05 (slightly taller than wide)
 * 
 * Used for avatars to indicate division tier in leaderboards.
 */
export function StatusRing({ 
  divisionSlug, 
  divisionColor, 
  size = 'md', 
  children, 
  className 
}: StatusRingProps) {
  const pixelSize = SIZE_MAP[size];
  const ringThickness = RING_THICKNESS_MAP[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center flex-shrink-0',
        className
      )}
      style={{
        width: `${pixelSize}px`,
        aspectRatio: '1 / 1.05',
        borderRadius: '34%',
        border: `${ringThickness}px solid ${divisionColor}`,
      }}
    >
      {children}
    </div>
  );
}
