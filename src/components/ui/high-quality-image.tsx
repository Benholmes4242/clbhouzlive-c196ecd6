import React, { useState, useEffect } from 'react';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';

interface HighQualityImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: () => void;
  onClick?: () => void;
}

const HighQualityImage: React.FC<HighQualityImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
  onLoad,
  onClick
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('🔴 IMAGE ERROR - Failed to load:', {
      src: imageSrc,
      optimizedSrc: getOptimizedImageUrl(imageSrc),
      width,
      height,
      error: e
    });
    
    // Try fallback to original URL if optimization failed
    if (imageSrc !== src && !hasError) {
      console.log('🔄 IMAGE ERROR - Trying fallback to original URL:', src);
      setImageSrc(src);
      return;
    }
    
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  // Generate optimized image URL using the centralized utility
  const getOptimizedImageUrl = (url: string) => {
    // First apply R2/CORS handling
    const directUrl = getDirectImageUrl(url);
    
    // Don't optimize video URLs or streaming URLs
    if (directUrl.includes('cloudflarestream.com') || 
        directUrl.includes('.m3u8') || 
        directUrl.includes('.mp4') || 
        directUrl.includes('.mov') ||
        directUrl.includes('customer-')) {
      return directUrl;
    }
    
    // If it's a Supabase storage URL, we can add optimization parameters
    if (directUrl.includes('supabase') && directUrl.includes('storage')) {
      const separator = directUrl.includes('?') ? '&' : '?';
      // Optimize for fast loading with reasonable quality
      const optimizedUrl = `${directUrl}${separator}quality=75&resize=contain&width=${width || 400}&height=${height || 400}&format=webp`;
      return optimizedUrl;
    }
    
    return directUrl;
  };

  const optimizedSrc = getOptimizedImageUrl(imageSrc);

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-[inherit]" />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-[inherit] transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          filter: 'contrast(1.1) saturate(1.1) brightness(1.05)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          maxWidth: '100%'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-muted rounded-[inherit] flex items-center justify-center">
          <div className="text-xs text-muted-foreground">Failed to load</div>
        </div>
      )}
    </div>
  );
};

export default HighQualityImage;