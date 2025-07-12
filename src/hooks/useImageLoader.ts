import { useState, useEffect, useCallback } from 'react';
import { getOptimalQuality, getQualityOptimizedUrl } from '@/utils/imageHelpers';

interface UseImageLoaderOptions {
  src: string;
  isInView: boolean;
  priority?: boolean;
  progressive?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  fallback?: string;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (e?: any) => void;
}

export const useImageLoader = ({
  src,
  isInView,
  priority = false,
  progressive = true,
  quality = 'auto',
  fallback = '/placeholder.svg',
  onLoadStart,
  onLoad,
  onError,
}: UseImageLoaderOptions) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [showLowQuality, setShowLowQuality] = useState(progressive);

  // Progressive loading effect
  useEffect(() => {
    if (!isInView && !priority) return;

    const optimalQuality = getOptimalQuality(quality);
    
    // Start with low quality for progressive loading
    if (progressive && optimalQuality !== 'low') {
      const lowQualitySrc = getQualityOptimizedUrl(src, 'low');
      setCurrentSrc(lowQualitySrc);
      setIsLoading(true);
      setShowLowQuality(true);
      onLoadStart?.();
      
      // Preload high quality version
      const highQualityImg = new Image();
      const highQualitySrc = getQualityOptimizedUrl(src, optimalQuality);
      
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
      const finalSrc = getQualityOptimizedUrl(src, optimalQuality);
      setCurrentSrc(finalSrc);
      setIsLoading(true);
      onLoadStart?.();
    }
  }, [isInView, priority, src, progressive, quality, onLoadStart, onLoad]);

  const handleLoad = useCallback(() => {
    if (!progressive) {
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.();
    }
  }, [progressive, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setCurrentSrc(fallback);
    onError?.();
  }, [fallback, onError]);

  return {
    isLoaded,
    isLoading,
    hasError,
    currentSrc,
    showLowQuality,
    handleLoad,
    handleError,
  };
};
