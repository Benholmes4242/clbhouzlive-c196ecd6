import React, { memo } from 'react';
import { OptimizedImage } from './optimized-image';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
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
  // Provide a default fallback image if src is null/empty
  const fallbackImageUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=${size}&h=${size}&fit=crop&crop=face`;
  const imageUrl = src || fallbackImageUrl;
  const optimizedSrc = getOptimizedImageUrl(imageUrl, size, size);

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
          decoding="async"
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {fallback || alt.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export const OptimizedAvatar = memo(OptimizedAvatarComponent);