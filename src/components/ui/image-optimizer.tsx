import React, { useState, useRef, useEffect } from 'react';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onClick?: () => void;
  priority?: boolean;
}

const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  onError,
  onClick,
  priority = false
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading (skip if priority)
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Optimize image URL for faster loading
  const getOptimizedSrc = (url: string) => {
    if (!url) return '';
    
    // If it's a Supabase storage URL, add optimization parameters
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=80&resize=contain&width=${width || 600}&format=webp`;
    }
    
    // If it's a Cloudflare Stream thumbnail, use it as-is (already optimized)
    if (url.includes('cloudflarestream.com') && url.includes('thumbnails')) {
      return url;
    }
    
    // For other external URLs, return as-is
    return url;
  };

  // Load image when it intersects
  useEffect(() => {
    if (hasIntersected && src) {
      const optimizedSrc = getOptimizedSrc(src);
      
      const img = new Image();
      img.onload = () => {
        setImageSrc(optimizedSrc);
        setIsLoading(false);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoading(false);
      };
      img.src = optimizedSrc;
    }
  }, [hasIntersected, src, width]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-[inherit]" />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-[inherit] transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          maxWidth: '100%'
        }}
        onError={handleError}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
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

export default ImageOptimizer;