import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';
import {
  getAvatarFallbackColor,
  getInitialsFromName,
} from '@/lib/avatarFallback';
import { 
  getRingColorForTotalPlayed,
  THEME_COLORS,
} from '@/lib/clbhouzAchievementPalette';

/**
 * 🎯 GLOBAL SQUIRCLE AVATAR - SINGLE SOURCE OF TRUTH 🎯
 * 
 * New squircle spec for all avatars:
 * - Aspect ratio: 1 / 1.05 (slightly taller than wide)
 * - Border radius: 34% (continuous soft squircle)
 * - overflow: hidden
 * - object-fit: cover for images
 * 
 * Ring styling:
 * - 2px border with tier-based color
 * - Falls back to #D1D5DB (gray) for users with 0-4 courses
 * - Uses getRingColorForTotalPlayed() from clbhouzAchievementPalette.ts
 */

// Size variants mapping
const SIZE_MAP = {
  xs: 28,
  sm: 40,
  md: 56,
  lg: 80,
  xl: 112,
  '2xl': 144,
} as const;

export type SquircleAvatarSize = keyof typeof SIZE_MAP | number;

export interface SquircleAvatarProps {
  /** Pixel value or size variant */
  size?: SquircleAvatarSize;
  /** Image source URL */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** Achievement ring color (hex). If provided, overrides top100Count-derived color */
  ringColor?: string | null;
  /** Top 100 courses played count - used to derive tier-based ring color */
  top100Count?: number;
  /** Hide ring entirely (no grey or colored ring) */
  hideRing?: boolean;
  /** Use a thin 1px ring instead of the standard 2px (for mini avatars) */
  thinRing?: boolean;
  /** Use a 0.5px hairline ring (for ultra-minimal contexts like the Clubhouse feed) */
  hairlineRing?: boolean;
  /** Fallback text (e.g., initials). If omitted, derived from `alt`. */
  fallback?: string;
  /** User UUID — used to derive deterministic fallback colour. If absent, hashes `alt` instead. */
  userId?: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Priority loading for above-fold avatars */
  priority?: boolean;
  /** Children (badges, overlays) */
  children?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Enable premium glow effect for achievement rings */
  enableGlow?: boolean;
}

/**
 * Convert hex color to rgba with alpha
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * SquircleAvatar - The global avatar component
 * 
 * @example Normal avatar (grey ring for 0-4 courses)
 * <SquircleAvatar src={user.avatar} size="md" />
 * 
 * @example Achievement avatar with top100Count (auto tier-based color)
 * <SquircleAvatar src={user.avatar} size="lg" top100Count={55} />
 * 
 * @example Achievement avatar with explicit ringColor (overrides auto)
 * <SquircleAvatar src={user.avatar} size="lg" ringColor="#8CE06A" />
 */
export const SquircleAvatar: React.FC<SquircleAvatarProps> = ({
  size = 'md',
  src,
  alt = '',
  ringColor,
  top100Count,
  hideRing = false,
  thinRing = false,
  hairlineRing = false,
  fallback,
  userId,
  className,
  onLoad,
  priority = false,
  children,
  onClick,
  enableGlow = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Convert size variant to pixel value
  const pixelSize = typeof size === 'string' ? SIZE_MAP[size] : size;

  // Determine effective ring color:
  // 1. Explicit ringColor prop takes precedence
  // 2. If top100Count is provided, derive from tier
  // 3. Default to gray for no data
  const effectiveRingColor = ringColor 
    ?? (top100Count !== undefined ? getRingColorForTotalPlayed(top100Count) : null);
  
  // Check if this is an "achievement" ring (non-gray color)
  const isAchievementTier = top100Count !== undefined && top100Count >= 5;
  const hasAchievementRing = Boolean(effectiveRingColor) && (ringColor || isAchievementTier);

  // Optimize image URL
  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setShowFallback(true);
      return;
    }

    const directUrl = getDirectImageUrl(src);
    
    if (directUrl === '/placeholder.svg') {
      setImageSrc(null);
      setShowFallback(true);
      return;
    }
    
    setImageSrc(directUrl);
    setShowFallback(false);
    setImageLoaded(false);
  }, [src]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setShowFallback(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setShowFallback(true);
    setImageLoaded(false);
  };

  // Compute deterministic fallback colour and initials.
  const fallbackColor = getAvatarFallbackColor(userId ?? alt);
  const fallbackInitials = fallback || getInitialsFromName(alt) || '?';

  // Initials are slightly smaller than silhouette proportions: ~36% of container.
  const fallbackFontSize = Math.max(10, Math.round(pixelSize * 0.36));

  // Inner avatar content (image or fallback)
  // Fallback is shown immediately (even while image is loading) so the avatar
  // is never invisible. The image cross-fades in on top once loaded.
  const avatarContent = (
    <>
      {(!imageLoaded || showFallback) && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: fallbackColor }}
        >
          <span
            style={{
              color: '#ffffff',
              fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              fontSize: `${fallbackFontSize}px`,
              lineHeight: 1,
              letterSpacing: '-0.01em',
              userSelect: 'none',
            }}
          >
            {fallbackInitials}
          </span>
        </div>
      )}
      {imageSrc && !showFallback && (
        <img
          src={imageSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </>
  );

  // Ring thickness: 2px standard, 1px thin, 0.5px hairline
  const ringThickness = hairlineRing ? 0.5 : thinRing ? 1 : 2;
  
  // Determine the border color
  const borderColor = hideRing 
    ? 'transparent' 
    : effectiveRingColor || THEME_COLORS.noTierGray;

  // Achievement state: colored ring with optional premium glow
  if (hasAchievementRing && effectiveRingColor) {
    // Build premium glow box-shadow if enabled
    const glowShadow = enableGlow
      ? `0 0 0 2px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.3), 0 0 14px ${hexToRgba(effectiveRingColor, 0.35)}`
      : undefined;

    return (
      <div
        className={cn(
          'inline-flex items-center justify-center flex-shrink-0 relative',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        {/* Outer glow halo (only when enableGlow) */}
        {enableGlow && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '34%',
              background: `radial-gradient(circle, ${hexToRgba(effectiveRingColor, 0.18)} 0%, transparent 70%)`,
              filter: 'blur(6px)',
              transform: 'scale(1.15)',
              opacity: 0.85,
            }}
          />
        )}
        <div
          className="relative overflow-hidden bg-white"
          style={{
            width: `${pixelSize}px`,
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
            border: `${ringThickness}px solid ${effectiveRingColor}`,
            boxShadow: glowShadow,
          }}
        >
          {avatarContent}
        </div>
        {children}
      </div>
    );
  }

  // Normal state: grey ring for no tier, or no ring if hideRing
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn("relative overflow-hidden", hideRing ? "bg-transparent" : "bg-white")}
        style={{
          width: `${pixelSize}px`,
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          border: hideRing ? 'none' : `${ringThickness}px solid ${borderColor}`,
        }}
      >
        {avatarContent}
      </div>
      {children}
    </div>
  );
};

export default SquircleAvatar;
