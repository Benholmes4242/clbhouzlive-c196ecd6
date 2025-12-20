import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PillVariant = 'ranking' | 'club' | 'duration';
export type PillSize = 'sm' | 'md';

interface GlassPillProps {
  /** Text label to display */
  label: string;
  /** Optional icon (emoji or Lucide icon) */
  icon?: ReactNode;
  /** Pill variant for styling differences */
  variant: PillVariant;
  /** Size variant */
  size?: PillSize;
  /** Additional CSS classes */
  className?: string;
  /** Click handler (optional - pills are usually non-interactive) */
  onClick?: (e: React.MouseEvent) => void;
  /** Whether the pill is clickable */
  interactive?: boolean;
}

/**
 * Unified glass pill component used across:
 * - Ranking pills (Popular today, Trending)
 * - Club tag pills (📍 Club name)
 * - Duration badges (8s, 1:03)
 * 
 * All variants share the same base "glass" styling:
 * - Dark translucent background
 * - Rounded pill shape
 * - Subtle backdrop blur
 * - White text
 * - Compact padding
 */
const GlassPill: React.FC<GlassPillProps> = ({
  label,
  icon,
  variant,
  size = 'sm',
  className,
  onClick,
  interactive = false,
}) => {
  const Component = interactive ? 'button' : 'div';
  
  return (
    <Component
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      className={cn(
        // Base glass style (shared across all variants)
        "inline-flex items-center rounded-full",
        "bg-black/70 backdrop-blur-sm",
        "border border-white/10",
        "shadow-sm",
        
        // Non-interactive by default
        !interactive && "pointer-events-none",
        interactive && "cursor-pointer hover:bg-black/80 transition-colors pointer-events-auto",
        
        // Size variants
        size === 'sm' && "px-2 py-1 gap-1",
        size === 'md' && "px-2.5 py-1.5 gap-1.5",
        
        // Variant-specific adjustments
        variant === 'duration' && "gap-0", // No gap for duration (no icon)
        variant === 'club' && "max-w-[180px] md:max-w-[220px]", // Truncate long club names
        
        className
      )}
    >
      {/* Icon (optional) */}
      {icon && (
        <span className={cn(
          "flex-shrink-0",
          size === 'sm' && "text-[10px]",
          size === 'md' && "text-xs",
        )}>
          {icon}
        </span>
      )}
      
      {/* Label */}
      <span
        className={cn(
          "leading-none font-semibold text-white",
          size === 'sm' && "text-[10px]",
          size === 'md' && "text-xs",
          variant === 'club' && "truncate", // Truncate long club names
        )}
      >
        {label}
      </span>
    </Component>
  );
};

export default GlassPill;

// ============= Ranking Utilities =============

export type RankingType = 'popular' | 'trending' | null;

export interface RankingInfo {
  type: RankingType;
  label: string;
  icon: string;
}

/**
 * Determine ranking type for an item
 * 
 * Rules:
 * - Popular today: top X% by likes in last 24 hours
 * - Trending: high engagement velocity (likes per hour) in last 3-6 hours
 * - Only one ranking per item (prefer Trending over Popular)
 */
export function getRankingInfo(item: {
  isPopular?: boolean;
  isTrending?: boolean;
}): RankingInfo | null {
  // Prefer Trending over Popular if both qualify
  if (item.isTrending) {
    return {
      type: 'trending',
      label: 'Trending',
      icon: '📈',
    };
  }
  
  if (item.isPopular) {
    return {
      type: 'popular',
      label: 'Popular today',
      icon: '🔥',
    };
  }
  
  return null;
}

// ============= Duration Formatting =============

/**
 * Formats duration for badge display
 * Under 60 seconds: 8s, 24s, 59s
 * 60 seconds or more: 1:03, 2:45
 * Always rounded to nearest second
 */
export function formatPillDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  
  if (s < 60) {
    return `${s}s`;
  }
  
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
