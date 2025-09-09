// Enhanced image optimization utilities for better performance

export const getOptimizedImageUrl = (url: string, opts: {
  width?: number; 
  height?: number; 
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg'; 
  resize?: 'cover' | 'contain' | 'fill';
} = {}): string => {
  const { width, height, quality = 75, format = 'webp', resize = 'cover' } = opts;
  
  // Don't optimize video URLs or streaming URLs
  if (url.includes('cloudflarestream.com') || 
      url.includes('.m3u8') || 
      url.includes('.mp4') || 
      url.includes('.mov') ||
      url.includes('customer-')) {
    return url;
  }

  // Use AVIF for better compression on supported browsers
  const preferredFormat = 'avif,webp,jpeg';
  
  try {
    const u = new URL(url);
    u.searchParams.set('f', preferredFormat);
    u.searchParams.set('q', String(quality));
    if (width) u.searchParams.set('w', String(width));
    if (height) u.searchParams.set('h', String(height));
    u.searchParams.set('fit', resize);
    return u.toString();
  } catch { 
    return url; 
  }
};

export const getResponsiveImageUrl = (url: string, baseWidth: number): string => {
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.min(baseWidth * dpr, baseWidth * 2); // Cap at 2x
  return getOptimizedImageUrl(url, { 
    width: targetWidth, 
    quality: dpr > 1 ? 65 : 75 // Lower quality for high DPI
  });
};

// Auto-sizing based on container and device
export const getAdaptiveImageUrl = (url: string, containerWidth: number, containerHeight?: number): string => {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.min(containerWidth * dpr, containerWidth * 2);
  const height = containerHeight ? Math.min(containerHeight * dpr, containerHeight * 2) : undefined;
  
  return getOptimizedImageUrl(url, { 
    width, 
    height,
    quality: dpr > 1 ? 65 : 75
  });
};

// Profile image sizes for common use cases
export const getProfileImageSizes = () => ({
  avatar: { width: 256, height: 256 },
  avatarSmall: { width: 128, height: 128 },
  avatarThumbnail: { width: 64, height: 64 },
  background: { width: 1200, height: 600 },
  card: { width: 400, height: 300 }
});

// Generate srcSet for responsive images
export const generateImageSrcSet = (originalUrl: string, sizes: Array<{width: number, height?: number}>): string => {
  return sizes
    .map(({ width, height }) => {
      const optimizedUrl = getOptimizedImageUrl(originalUrl, { width, height });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

// Preload critical images with priority
export const preloadCriticalImages = async (imageUrls: string[]): Promise<void> => {
  const preloadPromises = imageUrls.map(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    
    return new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve(); // Don't fail if image fails to load
    });
  });
  
  try {
    await Promise.allSettled(preloadPromises);
    console.log('Critical images preloaded');
  } catch (error) {
    console.warn('Some critical images failed to preload:', error);
  }
};