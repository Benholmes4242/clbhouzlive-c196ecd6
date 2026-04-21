import React, { memo } from 'react';
import { getDirectImageUrl, isR2Url, isPreviewEnvironment } from '@/utils/r2ImageUtils';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

if (process.env.NODE_ENV !== 'production') {
  console.error(
    '[OptimizedAvatar] Deprecated. Use <SquircleAvatar /> from @/components/ui/SquircleAvatar instead. See src/components/ui/AVATAR_GUIDELINES.md.'
  );
}

/**
 * ⚠️ FORBIDDEN FOR USER AVATARS - USE <Squircle /> ONLY ⚠️
 * 
 * ❌ DO NOT use this component for user avatars/profile photos
 * ✅ MUST use <Squircle> from @/components/ui/squircle.tsx instead
 * 
 * ALL user avatars across the entire application MUST use the superellipse 
 * squircle shape (n=5) for visual consistency. This is the ONLY allowed 
 * geometry for user photos.
 * 
 * This OptimizedAvatar component is DEPRECATED and FORBIDDEN for user avatars.
 * It may only be used for non-user content (system icons, brand logos, etc.).
 * 
 * @see src/components/ui/squircle.tsx - The ONLY source of truth for user avatars
 */

interface OptimizedAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
  fallback?: string;
  priority?: boolean;
}

const OptimizedAvatarComponent: React.FC<OptimizedAvatarProps> = ({
  src,
  alt = 'Avatar',
  className = '',
  size = 40,
  fallback,
  priority = false
}) => {
  // FORBIDDEN for user avatars - strict warning in development
  if (process.env.NODE_ENV === 'development') {
    console.error(
      '❌ FORBIDDEN: OptimizedAvatar component must NOT be used for user avatars!\n' +
      '✅ Use <Squircle> from @/components/ui/squircle.tsx instead.\n' +
      'All user avatars must use the superellipse squircle shape (n=5).'
    );
  }

  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setShowFallback(true);
      return;
    }

    const directUrl = getDirectImageUrl(src);
    
    // If it's a placeholder (R2 blocked in preview), show fallback immediately
    if (directUrl === '/placeholder.svg') {
      setImageSrc(null);
      setShowFallback(true);
      return;
    }
    
    setImageSrc(directUrl);
    setShowFallback(false);
  }, [src]);

  const handleImageError = () => {
    console.warn('Avatar image failed to load:', imageSrc);
    setShowFallback(true);
  };

  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {imageSrc && !showFallback ? (
        <AvatarImage 
          src={imageSrc}
          alt={alt}
          style={{ 
            width: size, 
            height: size,
            objectFit: 'cover'
          }}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={handleImageError}
        />
      ) : null}
      <AvatarFallback className="bg-muted text-foreground text-xs">
        {fallback || alt.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export const OptimizedAvatar = memo(OptimizedAvatarComponent);