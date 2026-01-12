/**
 * CollegeCrestTile - Signature UI component for college branding
 * Makes college logos feel like team badges, not small images
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type CrestTileSize = 'compact' | 'standard' | 'hero' | 'trophy';

interface CollegeCrestTileProps {
  logoUrl?: string | null;
  collegeName: string;
  size?: CrestTileSize;
  variant?: 'standard' | 'highlighted';
  className?: string;
}

const sizeConfig: Record<CrestTileSize, { container: string; logo: string }> = {
  compact: { container: 'w-9 h-9', logo: 'w-6 h-6' },      // 36px
  standard: { container: 'w-12 h-12', logo: 'w-8 h-8' },   // 48px
  hero: { container: 'w-16 h-16', logo: 'w-11 h-11' },     // 64px
  trophy: { container: 'w-[84px] h-[84px]', logo: 'w-14 h-14' }, // 84px
};

export const CollegeCrestTile: React.FC<CollegeCrestTileProps> = ({
  logoUrl,
  collegeName,
  size = 'standard',
  variant = 'standard',
  className,
}) => {
  const config = sizeConfig[size];
  const isHighlighted = variant === 'highlighted';

  return (
    <div
      className={cn(
        // Base styles - rounded square with glass background
        'relative flex items-center justify-center rounded-sq-sm',
        'bg-white/80 dark:bg-white/10',
        'border border-border/30 dark:border-white/10',
        'backdrop-blur-sm',
        // Soft shadow
        'shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        // Highlighted variant - subtle rim glow
        isHighlighted && [
          'ring-1 ring-brand-orange/30',
          'shadow-[0_2px_12px_rgba(248,156,42,0.15)]',
        ],
        // Size
        config.container,
        // Transition for interactions
        'transition-all duration-motion-fast ease-out',
        className
      )}
      title={collegeName}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${collegeName} logo`}
          className={cn(
            config.logo,
            'object-contain',
            // Ensure logo never gets cropped
            'max-w-[85%] max-h-[85%]'
          )}
        />
      ) : (
        // Fallback: first letter of college name
        <span className={cn(
          'font-medium text-muted-foreground',
          size === 'compact' && 'text-xs',
          size === 'standard' && 'text-sm',
          size === 'hero' && 'text-base',
          size === 'trophy' && 'text-lg',
        )}>
          {collegeName.charAt(0).toUpperCase()}
        </span>
      )}

      {/* Subtle highlight edge for highlighted variant */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-sq-sm bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default CollegeCrestTile;
