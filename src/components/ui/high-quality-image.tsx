import React, { useState, useEffect } from 'react';
import { getDirectImageUrl } from '@/utils/r2ImageUtils';
import { devlog, devwarn } from '@/utils/log';

interface HighQualityImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: () => void;
  onClick?: () => void;
  isAboveTheFold?: boolean; // default false - suppresses overlay for first screenful
}

const HighQualityImage: React.FC<HighQualityImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
  onLoad,
  onClick,
  isAboveTheFold = false
}) => {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    devlog('[HighQualityImage] Source changed', {
      src,
      previousSrc: imageSrc,
      isAboveTheFold
    });
    setImageSrc(src);
    setLoaded(false);
    setHasError(false);
  }, [src]);

  // ✅ Handle cached images that don't fire onLoad
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0 && !loaded && !hasError) {
      devlog('[HighQualityImage] Cached image detected, marking as loaded', {
        src: imageSrc,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight
      });
      // Use microtask to ensure handlers are attached
      queueMicrotask(() => handleImageLoad());
    }
  }, [imageSrc, loaded, hasError]);

  const handleImageLoad = () => {
    devlog('[HighQualityImage] Image loaded successfully', {
      src: imageSrc,
      optimizedSrc: getOptimizedImageUrl(imageSrc)
    });
    setLoaded(true);
    onLoad?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Check if this is actually a video file being passed to an image component
    const isVideoFile = imageSrc.includes('.mp4') || imageSrc.includes('.mov') || 
                       imageSrc.includes('.webm') || imageSrc.includes('cloudflarestream.com');
    
    if (isVideoFile) {
      devwarn('🚨 VIDEO FILE PASSED TO IMAGE COMPONENT:', {
        src: imageSrc,
        optimizedSrc: getOptimizedImageUrl(imageSrc),
        message: 'Video files should be handled by video components, not image components'
      });
      setHasError(true);
      setLoaded(true); // Clear overlay even on error
      if (onError) {
        onError(e);
      }
      return;
    }
    
    devlog('🔴 IMAGE ERROR - Failed to load:', {
      src: imageSrc,
      optimizedSrc: getOptimizedImageUrl(imageSrc),
      width,
      height,
      error: e
    });
    
    // Try fallback to original URL if optimization failed
    if (imageSrc !== src && !hasError) {
      devlog('🔄 IMAGE ERROR - Trying fallback to original URL:', src);
      setImageSrc(src);
      return;
    }
    
    setHasError(true);
    setLoaded(true); // Clear overlay even on error
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
    
    // For activity feeds, return direct URL without optimization to avoid loading issues
    if (directUrl.includes('supabase') && directUrl.includes('storage')) {
      return directUrl;
    }
    
    return directUrl;
  };

  const optimizedSrc = getOptimizedImageUrl(imageSrc);

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Remove grey overlay for above-the-fold images */}
      {!isAboveTheFold && !loaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-[inherit] z-0" />
      )}
      
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-[inherit] transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          maxWidth: '100%'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        width={width}
        height={height}
        loading={isAboveTheFold ? "eager" : "lazy"}
        fetchPriority={isAboveTheFold ? "high" : "auto"}
        decoding="async"
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-muted rounded-[inherit] flex items-center justify-center z-0">
          <div className="text-xs text-muted-foreground">Failed to load</div>
        </div>
      )}
    </div>
  );
};

export default HighQualityImage;