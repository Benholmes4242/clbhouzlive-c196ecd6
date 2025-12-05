import React from 'react';
import { cn } from '@/lib/utils';
import Top100TrophyIcon from '@/components/icons/Top100TrophyIcon';

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
 * AchievementBadge - SDS Squircle Glass style
 * 
 * A premium frosted glass squircle badge with the user's Top 100 achievement info.
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

  const basePadding = isLarge ? 'px-5 py-3' : 'px-4 py-2';
  const maxWidth = isLarge ? 'max-w-[420px]' : 'max-w-[340px]';
  const baseGap = isLarge ? 'gap-4' : 'gap-3';
  const baseTextCount = isLarge ? 'text-xl' : 'text-lg';
  const baseTextTitle = isLarge ? 'text-base' : 'text-sm';
  const baseTextTier = isLarge ? 'text-sm' : 'text-xs';
  const medallionSize = isLarge ? 'w-10 h-10' : 'w-9 h-9';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-between',
        basePadding,
        maxWidth,
        baseGap,
        'rounded-sq-md', // SDS squircle
        'backdrop-blur-xl',
        'border',
        className
      )}
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${ringColor} 15%, rgba(255,255,255,0.85)), color-mix(in srgb, ${ringColor} 25%, rgba(255,255,255,0.65)))`,
        borderColor: `color-mix(in srgb, ${ringColor} 30%, rgba(255,255,255,0.7))`,
        boxShadow: `0 8px 32px color-mix(in srgb, ${ringColor} 20%, rgba(0,0,0,0.12)), inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      {/* Text block (left) */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold text-gray-900',
              baseTextCount
            )}
          >
            {count}
          </span>
          <span
            className={cn(
              'font-medium text-gray-800',
              baseTextTitle
            )}
          >
            {title}
          </span>
        </div>
        <span
          className={cn(
            'font-semibold tracking-tight',
            baseTextTier
          )}
          style={{ color: ringColor }}
        >
          {tierLabel}
        </span>
      </div>

      {/* Medallion (right) - also squircle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-sq-sm',
          medallionSize
        )}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${ringColor} 70%, #ffffff), ${ringColor})`,
          boxShadow: `0 4px 12px color-mix(in srgb, ${ringColor} 40%, rgba(0,0,0,0.2)), inset 0 1px 0 rgba(255,255,255,0.4)`,
        }}
      >
        <Top100TrophyIcon
          className={cn(
            'text-white drop-shadow-sm',
            isLarge ? 'h-5 w-5' : 'h-4.5 w-4.5'
          )}
        />
      </div>
    </div>
  );
}

export default AchievementBadge;
