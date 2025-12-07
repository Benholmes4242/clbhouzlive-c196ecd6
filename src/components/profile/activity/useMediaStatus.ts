import { useState, useCallback } from 'react';
import { MediaStatus } from './types';

/**
 * Hook to manage media loading state with retry functionality
 */
export function useMediaStatus(initialUrl: string) {
  const [status, setStatus] = useState<MediaStatus>('loading');
  const [src, setSrc] = useState(initialUrl);
  const [retryCount, setRetryCount] = useState(0);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
  }, []);

  const handleError = useCallback(() => {
    setStatus('error');
  }, []);

  const retry = useCallback(() => {
    if (retryCount < 3) {
      setStatus('loading');
      setRetryCount(prev => prev + 1);
      // Add cache-busting param
      setSrc(`${initialUrl}${initialUrl.includes('?') ? '&' : '?'}retry=${retryCount + 1}`);
    }
  }, [initialUrl, retryCount]);

  return {
    status,
    src,
    onLoad: handleLoad,
    onError: handleError,
    retry,
    canRetry: retryCount < 3
  };
}

/**
 * Determine aspect ratio from image dimensions
 */
export function getAspectRatioFromDimensions(width: number, height: number): 'portrait' | 'square' | 'landscape' {
  const ratio = width / height;
  if (ratio < 0.85) return 'portrait';
  if (ratio > 1.15) return 'landscape';
  return 'square';
}

/**
 * Get CSS aspect ratio class based on aspect type
 */
export function getAspectClass(aspectRatio: 'portrait' | 'square' | 'landscape'): string {
  switch (aspectRatio) {
    case 'portrait':
      return 'aspect-[3/4]';
    case 'landscape':
      return 'aspect-[16/9]';
    default:
      return 'aspect-square';
  }
}
