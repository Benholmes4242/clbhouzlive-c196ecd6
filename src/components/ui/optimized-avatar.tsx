import React, { memo } from 'react';
import { OptimizedImage } from './optimized-image';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';
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
  // Use direct URL for R2 and video content
  const optimizedSrc = src ? getDirectImageUrl(src) : null;

  return (
    <Avatar className={className} style={{ width: size, height: size }}>
      {optimizedSrc ? (
        <AvatarImage 
          src={optimizedSrc}
          alt={alt}
          style={{ 
            width: size, 
            height: size,
            objectFit: 'cover'
          }}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          crossOrigin="anonymous"
          onLoad={() => {
            console.log('Avatar loaded successfully:', optimizedSrc);
          }}
          onError={(e) => {
            console.error('Avatar image failed to load:', optimizedSrc, e);
          }}
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {fallback || alt.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export const OptimizedAvatar = memo(OptimizedAvatarComponent);