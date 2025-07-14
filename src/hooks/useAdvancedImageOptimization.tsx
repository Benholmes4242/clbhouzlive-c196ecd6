import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  enableLQIP?: boolean; // Low Quality Image Placeholder
  enableProgressive?: boolean;
}

interface OptimizedImageData {
  url: string;
  lqip?: string; // Low quality placeholder
  srcSet?: string;
  sizes?: string;
  aspectRatio?: number;
}

export const useAdvancedImageOptimization = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
) => {
  const [optimizedImage, setOptimizedImage] = useState<OptimizedImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController>();

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    enableLQIP = true,
    enableProgressive = true
  } = options;

  const optimizeImage = useCallback(async () => {
    if (!originalUrl) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // For Supabase storage URLs, use direct optimization
      if (originalUrl.includes('supabase.co/storage/v1/object/public/')) {
        // Generate responsive sizes
        const generateSrcSet = () => {
          const sizes = [320, 640, 768, 1024, 1280, 1920];
          const baseWidth = width || 1024;
          
          return sizes
            .filter(size => size <= baseWidth * 1.5)
            .map(size => `${originalUrl} ${size}w`)
            .join(', ');
        };

        // Generate LQIP (Low Quality Image Placeholder)
        let lqip: string | undefined;
        if (enableLQIP) {
          // Create a tiny version for LQIP
          const canvas = document.createElement('canvas');
          canvas.width = 20;
          canvas.height = 15;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Create a simple gradient placeholder
            const gradient = ctx.createLinearGradient(0, 0, 20, 15);
            gradient.addColorStop(0, '#f3f4f6');
            gradient.addColorStop(1, '#e5e7eb');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 20, 15);
            lqip = canvas.toDataURL('image/jpeg', 0.1);
          }
        }

        const optimizedData: OptimizedImageData = {
          url: originalUrl,
          srcSet: generateSrcSet(),
          sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
          lqip,
          aspectRatio: width && height ? width / height : undefined
        };

        setOptimizedImage(optimizedData);
      } else {
        // For external URLs, use the edge function for optimization
        const { data, error: optimizationError } = await supabase.functions.invoke(
          'image-optimization',
          {
            body: {
              imageUrl: originalUrl,
              width,
              height,
              quality,
              format
            }
          }
        );

        if (optimizationError) throw optimizationError;

        setOptimizedImage({
          url: data.optimizedUrl || originalUrl,
          aspectRatio: width && height ? width / height : undefined
        });
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Image optimization error:', err);
        setError(err.message || 'Failed to optimize image');
        // Fallback to original URL
        setOptimizedImage({
          url: originalUrl,
          aspectRatio: width && height ? width / height : undefined
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalUrl, width, height, quality, format, enableLQIP, enableProgressive]);

  useEffect(() => {
    optimizeImage();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [optimizeImage]);

  // Preload critical images
  const preloadImage = useCallback((url: string, priority: 'high' | 'low' = 'low') => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    document.head.appendChild(link);
  }, []);

  // Smart loading based on intersection and network conditions
  const shouldEagerLoad = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && 
      (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
    
    return !isSlowConnection;
  }, []);

  return {
    optimizedImage,
    isLoading,
    error,
    preloadImage,
    shouldEagerLoad: shouldEagerLoad()
  };
};

// Hook for batch image optimization
export const useBatchImageOptimization = (urls: string[], options: ImageOptimizationOptions = {}) => {
  const [optimizedImages, setOptimizedImages] = useState<Map<string, OptimizedImageData>>(new Map());
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const optimizeImages = useCallback(async () => {
    if (!urls.length) return;

    // Initialize loading states
    const initialLoadingStates = new Map();
    urls.forEach(url => initialLoadingStates.set(url, true));
    setLoadingStates(initialLoadingStates);

    // Process images in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            // Use the single image optimization hook logic
            const { data, error } = await supabase.functions.invoke(
              'image-optimization',
              {
                body: {
                  imageUrl: url,
                  ...options
                }
              }
            );

            if (error) throw error;

            setOptimizedImages(prev => new Map(prev).set(url, {
              url: data.optimizedUrl || url,
              aspectRatio: options.width && options.height ? options.width / options.height : undefined
            }));

          } catch (err: any) {
            console.error(`Failed to optimize image ${url}:`, err);
            setErrors(prev => new Map(prev).set(url, err.message));
            // Fallback to original URL
            setOptimizedImages(prev => new Map(prev).set(url, { url }));
          } finally {
            setLoadingStates(prev => new Map(prev).set(url, false));
          }
        })
      );
    }
  }, [urls, options]);

  useEffect(() => {
    optimizeImages();
  }, [optimizeImages]);

  return {
    optimizedImages,
    loadingStates,
    errors,
    isAllLoaded: Array.from(loadingStates.values()).every(loading => !loading)
  };
};