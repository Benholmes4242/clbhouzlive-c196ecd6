// Image optimization utilities for better performance

export const getOptimizedImageUrl = (url: string, width?: number, height?: number, quality: number = 80, format: string = 'auto'): string => {
  if (!url) return url;
  
  // For Supabase storage URLs - Supabase doesn't support query param transformations
  // Instead, return the original URL and let the browser handle caching
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  // For external URLs (like Unsplash), add optimized parameters
  if (url.includes('unsplash.com')) {
    const urlObj = new URL(url);
    if (width) urlObj.searchParams.set('w', width.toString());
    if (height) urlObj.searchParams.set('h', height.toString());
    urlObj.searchParams.set('fit', 'crop');
    urlObj.searchParams.set('crop', 'face');
    urlObj.searchParams.set('q', quality.toString());
    
    // Set format based on browser support
    if (format === 'auto' || format === 'webp') {
      urlObj.searchParams.set('fm', 'webp');
    } else if (format === 'avif') {
      urlObj.searchParams.set('fm', 'avif');
    }
    
    return urlObj.toString();
  }
  
  return url;
};

// Get optimized avatar sizes based on context
export const getAvatarSize = (context: 'thumbnail' | 'small' | 'medium' | 'large' = 'small'): number => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  const sizes = {
    thumbnail: isMobile ? 32 : 40,
    small: isMobile ? 40 : 48,
    medium: isMobile ? 64 : 80,
    large: isMobile ? 120 : 160
  };
  
  return sizes[context];
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
};

// Optimize images for different screen sizes
export const getResponsiveImageSizes = () => {
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  
  if (screenWidth <= 640) { // Mobile - more aggressive compression
    return { width: 320, height: 320 };
  } else if (screenWidth <= 1024) { // Tablet
    return { width: 480, height: 480 };
  } else { // Desktop
    return { width: 640, height: 640 };
  }
};

// Preload critical images for better perceived performance
// Generate responsive image sizes for srcset
export const generateResponsiveSizes = (baseWidth?: number, baseHeight?: number) => {
  const sizes = [320, 640, 768, 1024, 1280, 1920];
  const aspectRatio = baseWidth && baseHeight ? baseWidth / baseHeight : 1;
  
  return sizes
    .filter(size => !baseWidth || size <= baseWidth * 1.5) // Don't generate sizes much larger than original
    .map(width => ({
      width,
      height: Math.round(width / aspectRatio)
    }));
};

// Enhanced critical image preloading with responsive sizes
export const preloadCriticalImages = (urls: string[], options: { quality?: number, format?: string } = {}) => {
  if (typeof window === 'undefined') return;
  
  const { quality = 80, format = 'webp' } = options;
  
  urls.slice(0, 3).forEach(url => { // Only preload first 3 images
    // Preload multiple sizes for responsive images
    const sizes = [320, 640, 1024];
    
    sizes.forEach(size => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getOptimizedImageUrl(url, size, undefined, quality, format);
      link.media = `(max-width: ${size}px)`;
      document.head.appendChild(link);
    });
  });
};

// Smart preloading based on connection and device
export const smartPreload = (urls: string[]) => {
  if (typeof window === 'undefined') return;
  
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  const preloadCount = isSlowConnection ? 1 : 3;
  
  preloadCriticalImages(urls.slice(0, preloadCount), {
    quality: isSlowConnection ? 60 : 80,
    format: 'webp'
  });
};