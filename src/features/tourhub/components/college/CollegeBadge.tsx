/**
 * CollegeBadge - Consistent college logo/monogram rendering
 * Shield or circle variant with loading and missing logo states
 */

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';
type BadgeVariant = 'shield' | 'circle';

interface CollegeBadgeProps {
  logoUrl?: string | null;
  name: string;
  primaryColor?: string;
  size?: BadgeSize;
  variant?: BadgeVariant;
  isLoading?: boolean;
  className?: string;
}

const sizeConfig: Record<BadgeSize, { container: string; logo: string; monogram: string }> = {
  sm: { container: 'w-10 h-10', logo: 'w-7 h-7', monogram: 'text-sm' },
  md: { container: 'w-14 h-14', logo: 'w-10 h-10', monogram: 'text-lg' },
  lg: { container: 'w-16 h-16', logo: 'w-12 h-12', monogram: 'text-xl' },
  xl: { container: 'w-20 h-20', logo: 'w-14 h-14', monogram: 'text-2xl' },
};

export const CollegeBadge: React.FC<CollegeBadgeProps> = ({
  logoUrl,
  name,
  primaryColor,
  size = 'md',
  variant = 'shield',
  isLoading = false,
  className,
}) => {
  const config = sizeConfig[size];
  const isShield = variant === 'shield';

  // Get monogram from name
  const getMonogram = () => {
    const words = name.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted animate-pulse',
          isShield ? 'rounded-sq-sm' : 'rounded-full',
          config.container,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'bg-white dark:bg-white/10',
        'border border-border/30 dark:border-white/10',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)]',
        isShield ? 'rounded-sq-sm' : 'rounded-full',
        config.container,
        className
      )}
      style={primaryColor ? { borderColor: `${primaryColor}30` } : undefined}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className={cn(config.logo, 'object-contain')}
          loading="lazy"
        />
      ) : (
        <span
          className={cn(
            'font-bold text-muted-foreground',
            config.monogram
          )}
          style={primaryColor ? { color: primaryColor } : undefined}
        >
          {getMonogram()}
        </span>
      )}
    </div>
  );
};

export default CollegeBadge;
