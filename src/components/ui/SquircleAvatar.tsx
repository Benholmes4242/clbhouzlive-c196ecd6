import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';
import { 
  getTierFromTop100Count, 
  RING_TOKENS, 
  hexToRgba,
  type AchievementRingTier 
} from '@/lib/achievementRingTokens';

/**
 * 🎯 GLOBAL SQUIRCLE AVATAR - SINGLE SOURCE OF TRUTH 🎯
 * 
 * New squircle spec for all avatars:
 * - Aspect ratio: 1 / 1.05 (slightly taller than wide)
 * - Border radius: 34% (continuous soft squircle)
 * - overflow: hidden
 * - object-fit: cover for images
 * 
 * All avatars use 2.5px ring thickness with data-driven tier colors
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
  /** Achievement ring color (hex). If provided, shows outer colored ring with glow */
  ringColor?: string | null;
  /** Top 100 courses played count - used to derive tier-based ring color */
  top100Count?: number;
  /** Hide ring entirely (no grey or colored ring) */
  hideRing?: boolean;
  /** Use a thin 0.5px ring instead of the standard 2.5px (for mini avatars) */
  thinRing?: boolean;
  /** Fallback text (e.g., initials) */
  fallback?: string;
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
 * SquircleAvatar - The new global avatar component
 * 
 * @example Normal avatar (grey ring)
 * <SquircleAvatar src={user.avatar} size="md" />
 * 
 * @example Achievement avatar with top100Count (auto tier-based color + glow)
 * <SquircleAvatar src={user.avatar} size="lg" top100Count={55} enableGlow />
 * 
 * @example Achievement avatar with explicit ringColor
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
  fallback,
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

  // Derive tier and colors from top100Count if provided
  const tier: AchievementRingTier = top100Count !== undefined 
    ? getTierFromTop100Count(top100Count) 
    : 'NONE';
  
  // Determine effective ring color: explicit ringColor takes precedence, then top100Count-derived
  const effectiveRingColor = ringColor ?? (top100Count !== undefined && tier !== 'NONE' 
    ? RING_TOKENS[tier].accent 
    : null);
  
  const hasAchievementRing = Boolean(effectiveRingColor);
  const tierTokens = tier !== 'NONE' ? RING_TOKENS[tier] : null;

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

  // Fallback content (initials or first letter)
  const fallbackContent = fallback || alt.charAt(0).toUpperCase() || '?';
  
  // Calculate fallback font size based on avatar size
  const fallbackFontSize = Math.round(pixelSize * 0.38);

  // Inner avatar content (image or fallback)
  const avatarContent = (
    <>
      {imageSrc && !showFallback && (
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      {showFallback && (
        <div
          className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-semibold select-none"
          style={{ fontSize: `${fallbackFontSize}px` }}
        >
          {fallbackContent}
        </div>
      )}
    </>
  );

  // Achievement state: colored ring with optional premium glow
  if (hasAchievementRing) {
    // Build premium glow box-shadow if enabled
    const glowShadow = enableGlow && tierTokens
      ? `0 0 0 3px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.35), 0 0 18px ${hexToRgba(tierTokens.accent, 0.4)}`
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
        {enableGlow && tierTokens && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: '34%',
              background: `radial-gradient(circle, ${hexToRgba(tierTokens.accent, 0.18)} 0%, transparent 70%)`,
              filter: 'blur(6px)',
              transform: 'scale(1.15)',
              opacity: 0.85,
            }}
          />
        )}
        <div
          className="relative overflow-hidden"
          style={{
            width: `${pixelSize}px`,
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
            border: `2.5px solid ${effectiveRingColor}`,
            boxShadow: glowShadow,
          }}
        >
          {avatarContent}
        </div>
        {children}
      </div>
    );
  }

  // Normal state: single grey ring around avatar (or no ring if hideRing)
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
        className="relative overflow-hidden"
        style={{
          width: `${pixelSize}px`,
          aspectRatio: '1 / 1.05',
          borderRadius: '34%',
          border: hideRing ? 'none' : thinRing ? '0.5px solid #9CA3AF' : '2.5px solid #D1D5DB',
        }}
      >
        {avatarContent}
      </div>
      {children}
    </div>
  );
};

export default SquircleAvatar;
