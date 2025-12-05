import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AchievementBadgeProps {
  /** Number of Top 100 courses played */
  count: number;
  /** Title text, e.g. "Top 100" */
  title?: string;
  /** Tier label, e.g. "Founders Club" */
  tierLabel?: string;
  /** Achievement ring color - must match the avatar ring color */
  ringColor: string;
  /** Size variant: lg for profile page, md for avatar overlay */
  size?: 'md' | 'lg';
  /** Additional CSS classes for positioning */
  className?: string;
}

/**
 * AchievementBadge - Apple Glass Ultra Right Medallion style
 * 
 * A frosted glass badge with the user's Top 100 achievement info.
 * Uses the exact same color as the achievement ring around the avatar.
 * 
 * @example
 * <AchievementBadge
 *   count={41}
 *   title="Top 100"
 *   tierLabel="Founders Club"
 *   ringColor="#2F7D32"
 *   size="lg"
 * />
 */
export function AchievementBadge({
  count,
  title = 'Top 100',
  tierLabel = 'Founders Club',
  ringColor,
  size = 'md',
  className = '',
}: AchievementBadgeProps) {
  const isLarge = size === 'lg';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-between',
        'rounded-[20px]',
        'backdrop-blur-xl',
        'border',
        isLarge ? 'px-5 py-3 gap-4 min-h-[56px]' : 'px-4 py-2.5 gap-3 min-h-[48px]',
        className
      )}
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${ringColor} 15%, rgba(255,255,255,0.65)), color-mix(in srgb, ${ringColor} 25%, rgba(255,255,255,0.20)))`,
        borderColor: ringColor,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.12), 0 0 0 1.5px ${ringColor}66`,
      }}
    >
      {/* Text block (left) */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold text-gray-900',
              isLarge ? 'text-xl' : 'text-lg'
            )}
          >
            {count}
          </span>
          <span
            className={cn(
              'font-medium text-gray-800',
              isLarge ? 'text-base' : 'text-sm'
            )}
          >
            {title}
          </span>
        </div>
        <span
          className={cn(
            'font-semibold',
            isLarge ? 'text-sm' : 'text-xs'
          )}
          style={{ color: ringColor }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Medallion (right) */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          isLarge ? 'w-10 h-10' : 'w-9 h-9'
        )}
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9), ${ringColor})`,
          boxShadow: `0 2px 8px rgba(0,0,0,0.15), 0 0 16px ${ringColor}66`,
        }}
      >
        {/* Inner glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `inset 0 0 8px ${ringColor}44`,
          }}
        />
        {/* Trophy icon */}
        <Trophy
          className={cn(
            'relative text-white drop-shadow-sm',
            isLarge ? 'w-5 h-5' : 'w-4 h-4'
          )}
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
}

export default AchievementBadge;
