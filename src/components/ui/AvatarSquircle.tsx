import React, { useState, useEffect } from "react";
import { Squircle } from "./squircle";
import { getDirectImageUrl } from '@/utils/r2ImageUtils';

// Size variants mapping
const SIZE_MAP = {
  xs: 28,
  sm: 40,
  md: 56,
  lg: 80,
  xl: 112,
} as const;

type SizeVariant = keyof typeof SIZE_MAP;

type Props = {
  size?: number | SizeVariant;  // pixel value or variant (default: 'md')
  src?: string | null;          // optional - if not provided, fallback will be shown
  alt?: string;
  ringColor?: string;           // optional border ring
  ringWidth?: number;           // default 0 = no ring
  className?: string;           // extra positioning classes
  fallback?: string;            // fallback text (e.g., initials)
  children?: React.ReactNode;   // badges (e.g., status dot) or custom content
  onLoad?: () => void;          // callback when image loads
  priority?: boolean;           // eager loading for above-fold avatars
};

/**
 * ⚠️ DEPRECATED - USE <Squircle /> DIRECTLY INSTEAD ⚠️
 * 
 * ❌ DO NOT use AvatarSquircle - it adds unnecessary wrapper complexity
 * ✅ MUST use <Squircle> from @/components/ui/squircle.tsx directly
 * 
 * This wrapper component is DEPRECATED. All user avatars must use 
 * <Squircle> directly as the single source of truth for avatar geometry.
 * 
 * @deprecated Use <Squircle> from @/components/ui/squircle.tsx instead
 * @see src/components/ui/squircle.tsx - The ONLY allowed component for user avatars
 * 
 * @example CORRECT usage with <Squircle>
 * <Squircle width={56} height={56}>
 *   <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 * </Squircle>
 */
export default function AvatarSquircle({
  size = 'md',
  src,
  alt = "",
  ringColor,
  ringWidth = 0,
  className = "",
  fallback,
  children,
  onLoad,
  priority = false
}: Props) {
  // FORBIDDEN for new code - strict warning in development
  if (process.env.NODE_ENV === 'development') {
    console.error(
      '❌ DEPRECATED: AvatarSquircle is deprecated!\n' +
      '✅ Use <Squircle> from @/components/ui/squircle.tsx directly instead.\n' +
      'All user avatars must use <Squircle> as the single source of truth.'
    );
  }
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Convert size variant to pixel value
  const pixelSize = typeof size === 'string' ? SIZE_MAP[size] : size;

  // Optimize image URL (R2, responsive sizes)
  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setShowFallback(true);
      return;
    }

    const directUrl = getDirectImageUrl(src);
    
    // If it's a placeholder (R2 blocked in preview), show fallback
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
    console.warn('Avatar image failed to load:', imageSrc);
    setShowFallback(true);
    setImageLoaded(false);
  };

  // Fallback content (initials or first letter)
  const fallbackContent = fallback || alt.charAt(0).toUpperCase() || '?';

  const inner = (
    <>
      {imageSrc && !showFallback && (
        <img
          src={imageSrc}
          alt={alt}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            display: "block",
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      {showFallback && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--hub-glass-bg-elevated, rgba(255,255,255,0.1))",
            color: "var(--hub-text-bright, rgba(255,255,255,0.9))",
            fontSize: `${pixelSize * 0.4}px`,
            fontWeight: 600,
            userSelect: "none"
          }}
        >
          {fallbackContent}
        </div>
      )}
      {children}
    </>
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: pixelSize,
        height: pixelSize,
        flexShrink: 0,
        // If a ring is requested, draw it behind via box-shadow
        boxShadow: ringWidth && ringColor ? `0 0 0 ${ringWidth}px ${ringColor} inset` : undefined,
        borderRadius: 0,
        overflow: "visible"
      }}
    >
      <Squircle width={pixelSize} height={pixelSize}>{inner}</Squircle>
    </div>
  );
}
