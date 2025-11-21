// Image optimization utilities for better performance
import { isValidR2Url } from './r2BucketMapping';

export const getOptimizedImageUrl = (
  originalUrl: string,
  width?: number,
  height?: number,
  quality: number = 85,
  format: string = 'webp'
): string => {
  try {
    // Don't optimize video URLs or streaming URLs
    if (originalUrl.includes('cloudflarestream.com') || 
        originalUrl.includes('.m3u8') || 
        originalUrl.includes('.mp4') || 
        originalUrl.includes('.mov') ||
        originalUrl.includes('customer-')) {
      return originalUrl;
    }

    // Only optimize valid R2 image URLs (supports legacy + new buckets)
    if (!isValidR2Url(originalUrl)) {
      return originalUrl;
    }

    const url = new URL(originalUrl);
    
    // Add optimization parameters for R2 images (works for both legacy and new)
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    url.searchParams.set('fit', 'cover');
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', format);
    
    return url.toString();
  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return originalUrl;
  }
};

export const preloadImage = (url: string, priority: boolean = false): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    if (priority) {
      img.fetchPriority = 'high';
    }
    
    img.src = url;
  });
};

export const getProfileImageSizes = () => ({
  avatar: { width: 256, height: 256 },
  avatarSmall: { width: 128, height: 128 },
  background: { width: 800, height: 600 },
  thumbnail: { width: 64, height: 64 }
});

export const generateImageSrcSet = (originalUrl: string, sizes: Array<{width: number, height: number}>): string => {
  return sizes
    .map(({ width, height }) => {
      const optimizedUrl = getOptimizedImageUrl(originalUrl, width, height);
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
};

// Additional functions for compatibility
export const getAvatarSize = (size: 'small' | 'medium' | 'large' | 'thumbnail' = 'medium'): number => {
  const sizes = {
    small: 32,
    medium: 64,
    large: 128,
    thumbnail: 24
  };
  return sizes[size];
};

export const generateResponsiveSizes = (baseWidth?: number, baseHeight?: number): Array<{width: number, height: number}> => {
  const width = baseWidth || 400;
  const height = baseHeight || width;
  
  return [
    { width: width, height: height },
    { width: Math.floor(width * 0.75), height: Math.floor(height * 0.75) },
    { width: Math.floor(width * 0.5), height: Math.floor(height * 0.5) }
  ];
};

export const preloadCriticalImages = async (imageUrls: string[]): Promise<void> => {
  const preloadPromises = imageUrls.map(url => preloadImage(url, true));
  try {
    await Promise.allSettled(preloadPromises);
    console.log('Critical images preloaded');
  } catch (error) {
    console.warn('Some critical images failed to preload:', error);
  }
};