// Image optimization utilities for better performance

export const getOptimizedImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return url;
  
  // For Supabase storage URLs - Supabase doesn't support query param transformations
  // Instead, return the original URL and let the browser handle caching
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  // For external URLs (like Unsplash), add mobile-optimized parameters
  if (url.includes('unsplash.com')) {
    const urlObj = new URL(url);
    if (width && height) {
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('h', height.toString());
      urlObj.searchParams.set('fit', 'crop');
      urlObj.searchParams.set('crop', 'face');
      urlObj.searchParams.set('q', '80');
      urlObj.searchParams.set('fm', 'webp');
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
export const preloadCriticalImages = (urls: string[]) => {
  if (typeof window === 'undefined') return;
  
  urls.slice(0, 3).forEach(url => { // Only preload first 3 images
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};