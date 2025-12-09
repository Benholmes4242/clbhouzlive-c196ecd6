import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';

/**
 * 🎯 GLOBAL SQUIRCLE AVATAR - SINGLE SOURCE OF TRUTH 🎯
 * 
 * New squircle spec for all avatars:
 * - Aspect ratio: 1 / 1.05 (slightly taller than wide)
 * - Border radius: 34% (continuous soft squircle)
 * - overflow: hidden
 * - object-fit: cover for images
 * 
 * All avatars use 2.5px ring thickness (grey for normal, colored for achievement)
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
  /** Achievement ring color (e.g., '#8CE06A' for Founder). If provided, shows outer colored ring */
  ringColor?: string | null;
  /** Hide ring entirely (no grey or colored ring) */
  hideRing?: boolean;
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
}

/**
 * SquircleAvatar - The new global avatar component
 * 
 * @example Normal avatar (1px grey ring)
 * <SquircleAvatar src={user.avatar} size="md" />
 * 
 * @example Achievement avatar (colored outer ring + grey inner ring)
 * <SquircleAvatar src={user.avatar} size="lg" ringColor="#8CE06A" />
 */
export const SquircleAvatar: React.FC<SquircleAvatarProps> = ({
  size = 'md',
  src,
  alt = '',
  ringColor,
  hideRing = false,
  fallback,
  className,
  onLoad,
  priority = false,
  children,
  onClick,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Convert size variant to pixel value
  const pixelSize = typeof size === 'string' ? SIZE_MAP[size] : size;

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

  const hasAchievementRing = Boolean(ringColor);

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

  // Achievement state: colored ring directly on avatar (no grey ring)
  if (hasAchievementRing) {
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
            border: `2.5px solid ${ringColor}`,
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
          border: hideRing ? 'none' : '2.5px solid #D1D5DB',
        }}
      >
        {avatarContent}
      </div>
      {children}
    </div>
  );
};

export default SquircleAvatar;
