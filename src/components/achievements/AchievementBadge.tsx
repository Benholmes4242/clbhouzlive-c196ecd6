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
 * AchievementBadge - Apple Glass Ultra Capsule style
 * 
 * A premium frosted glass capsule badge with the user's Top 100 achievement info.
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
        'rounded-[999px]',
        'backdrop-blur-xl',
        'border',
        className
      )}
      style={{
        background: `radial-gradient(circle at 0% 0%, color-mix(in srgb, ${ringColor} 12%, rgba(255,255,255,0.78)), color-mix(in srgb, ${ringColor} 22%, rgba(255,255,255,0.22)))`,
        borderColor: 'rgba(255,255,255,0.65)',
        boxShadow: `0 10px 30px rgba(0,0,0,0.18), 0 0 0 1px ${ringColor}33`,
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

      {/* Medallion (right) */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          medallionSize
        )}
        style={{
          background: `radial-gradient(circle at 30% 0%, #ffffff, ${ringColor})`,
          boxShadow: `0 6px 14px rgba(0,0,0,0.20), 0 0 18px ${ringColor}80`,
        }}
      >
        {/* Inner jewel ring */}
        <div
          className="relative flex items-center justify-center rounded-full w-[70%] h-[70%]"
          style={{
            background: 'rgba(255,255,255,0.10)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.35)',
          }}
        >
          <Trophy
            className="text-white drop-shadow-sm"
            size={isLarge ? 16 : 14}
            strokeWidth={2.5}
          />
        </div>
      </div>
    </div>
  );
}

export default AchievementBadge;
