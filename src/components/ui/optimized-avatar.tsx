import React, { memo } from 'react';
import { getDirectImageUrl, isR2Url } from '@/utils/r2ImageUtils';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

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
  // Use direct URL for R2 and video content - try original first, fallback if needed
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      setImageSrc(null);
      setHasError(false);
      return;
    }

    const directUrl = getDirectImageUrl(src);
    setImageSrc(directUrl);
    setHasError(false);
  }, [src]);

  const handleImageError = () => {
    console.warn('Avatar image failed to load:', imageSrc);
    setHasError(true);
  };

  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {imageSrc && !hasError ? (
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