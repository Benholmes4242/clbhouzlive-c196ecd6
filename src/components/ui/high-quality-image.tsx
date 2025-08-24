import React, { useState, useEffect } from 'react';

interface HighQualityImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
}

const HighQualityImage: React.FC<HighQualityImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
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
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  // Generate optimized image URL if it's from Supabase storage
  const getOptimizedImageUrl = (url: string) => {
    // If it's a Supabase storage URL, we can add optimization parameters
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      // Optimize for fast loading with reasonable quality
      const optimizedUrl = `${url}${separator}quality=75&resize=contain&width=${width || 400}&height=${height || 400}&format=webp`;
      return optimizedUrl;
    }
    
    return url;
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