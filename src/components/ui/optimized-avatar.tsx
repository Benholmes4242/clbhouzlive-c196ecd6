import React, { memo } from 'react';
import { getDirectImageUrl, isR2Url, isPreviewEnvironment } from '@/utils/r2ImageUtils';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

/**
 * ⚠️ DEPRECATED FOR USER AVATARS
 * 
 * This circular OptimizedAvatar component should NO LONGER be used for user avatars.
 * Use <AvatarSquircle> from @/components/ui/AvatarSquircle instead.
 * 
 * All user avatars must use the superellipse squircle shape (n=5) for consistency.
 * 
 * This component may remain for non-avatar use cases (e.g., system icons, brand logos).
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
  // Deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ Deprecated: OptimizedAvatar is deprecated for user avatars. Use <AvatarSquircle> instead.'
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
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {fallback || alt.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export const OptimizedAvatar = memo(OptimizedAvatarComponent);