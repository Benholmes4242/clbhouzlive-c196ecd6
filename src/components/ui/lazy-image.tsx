import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  progressive?: boolean;
  fallback?: string;
  responsive?: boolean;
  sizes?: string;
  blur?: boolean;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (e?: any) => void;
}

/**
 * Enhanced LazyImage with WebP conversion, progressive loading, and connection-aware quality
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  quality = 'auto',
  progressive = true,
  responsive = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  blur = true,
  fallback = '/placeholder.svg',
  onLoadStart,
  onLoad,
  onError,
  ...props
}) => {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [showLowQuality, setShowLowQuality] = useState(progressive);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get connection-aware quality
  const getOptimalQuality = useCallback(() => {
    if (quality !== 'auto') return quality;
    
    const connection = (navigator as any)?.connection;
    if (!connection) return 'medium';
    
    const { effectiveType, downlink } = connection;
    
    if (effectiveType === '4g' && downlink > 5) return 'high';
    if (effectiveType === '3g' || downlink > 1.5) return 'medium';
    return 'low';
  }, [quality]);

  // Generate responsive image sources
  const generateSrcSet = useCallback((originalSrc: string) => {
    if (!responsive || !originalSrc.includes('supabase')) return '';
    
    const sizes = [400, 800, 1200, 1600];
    const qualities = { low: 30, medium: 70, high: 90 };
    const optimalQuality = getOptimalQuality();
    
    return sizes.map(size => {
      const url = new URL(originalSrc);
      url.searchParams.set('width', size.toString());
      url.searchParams.set('quality', qualities[optimalQuality].toString());
      url.searchParams.set('format', 'webp');
      return `${url.toString()} ${size}w`;
    }).join(', ');
  }, [responsive, getOptimalQuality]);

  // Generate blur placeholder data URL
  const generateBlurPlaceholder = useCallback(() => {
    if (!blur) return '';
    
    // Create a tiny 10x10 blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Create gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, 10, 10);
    gradient.addColorStop(0, '#f3f4f6');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 10, 10);
    
    return canvas.toDataURL('image/jpeg', 0.1);
  }, [blur]);

  // Convert image to optimized format with quality settings
  const getOptimizedImageUrl = useCallback((originalSrc: string, targetQuality: string) => {
    // If it's already a Supabase storage URL, add transformation params
    if (originalSrc.includes('supabase')) {
      const url = new URL(originalSrc);
      
      // Add quality and format transformations
      switch (targetQuality) {
        case 'low':
          url.searchParams.set('quality', '30');
          url.searchParams.set('width', '400');
          break;
        case 'medium':
          url.searchParams.set('quality', '70');
          url.searchParams.set('width', '800');
          break;
        case 'high':
          url.searchParams.set('quality', '90');
          break;
      }
      
      // Try to convert to WebP
      url.searchParams.set('format', 'webp');
      return url.toString();
    }
    
    return originalSrc;
  }, []);

  // Intersection Observer for lazy loading
  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (containerRef.current) {
      containerRef.current = null;
    }
    
    if (node && !priority && !isInView) {
      containerRef.current = node;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px', // Reduced from 100px for faster loading
          threshold: 0.1,
        }
      );
      
      observer.observe(node);
      
      return () => {
        observer.unobserve(node);
      };
    }
  }, [priority, isInView]);

  // Progressive loading effect
  useEffect(() => {
    if (!isInView && !priority) return;

    const optimalQuality = getOptimalQuality();
    
    // Start with low quality for progressive loading
    if (progressive && optimalQuality !== 'low') {
      const lowQualitySrc = getOptimizedImageUrl(src, 'low');
      setCurrentSrc(lowQualitySrc);
      setIsLoading(true);
      setShowLowQuality(true);
      onLoadStart?.();
      
      // Preload high quality version
      const highQualityImg = new Image();
      const highQualitySrc = getOptimizedImageUrl(src, optimalQuality);
      
      highQualityImg.onload = () => {
        // Smooth transition to high quality
        setTimeout(() => {
          setCurrentSrc(highQualitySrc);
          setShowLowQuality(false);
          setIsLoaded(true);
          setIsLoading(false);
          onLoad?.();
        }, 100);
      };
      
      highQualityImg.onerror = () => {
        // Keep low quality if high quality fails
        setIsLoaded(true);
        setIsLoading(false);
        onLoad?.();
      };
      
      highQualityImg.src = highQualitySrc;
    } else {
      // Direct loading without progressive enhancement
      const finalSrc = getOptimizedImageUrl(src, optimalQuality);
      setCurrentSrc(finalSrc);
      setIsLoading(true);
      onLoadStart?.();
    }
  }, [isInView, priority, src, progressive, getOptimalQuality, getOptimizedImageUrl, onLoadStart, onLoad]);

  const handleLoad = () => {
    if (!progressive) {
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.();
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setCurrentSrc(fallback);
    onError?.();
  };

  const shouldLoad = isInView || priority;

  return (
    <div 
      ref={setContainerRef}
      className={cn('relative overflow-hidden bg-muted', className)}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}

      {/* Blur placeholder */}
      {blur && !isLoaded && shouldLoad && (
        <img
          src={generateBlurPlaceholder()}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main image with responsive support */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={currentSrc || fallback}
          srcSet={responsive ? generateSrcSet(src) : undefined}
          sizes={responsive ? sizes : undefined}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            isLoading && 'opacity-70',
            showLowQuality && 'filter blur-[1px]',
            hasError && 'opacity-50',
            !isLoaded && blur && 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-muted-foreground text-xs">
            Failed to load
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;