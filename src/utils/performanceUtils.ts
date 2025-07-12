/**
 * Performance optimization utilities
 */

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

/**
 * Prefetch resources for next navigation
 */
export const prefetchResource = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Create optimized image URL with quality and format parameters
 */
export const createOptimizedImageUrl = (
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  const { width, height, quality = 85, format = 'auto', fit = 'cover' } = options;

  // Handle Unsplash URLs
  if (originalUrl.includes('unsplash.com')) {
    const url = new URL(originalUrl);
    
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', fit);
    
    if (format !== 'auto') {
      url.searchParams.set('fm', format);
    }
    
    return url.toString();
  }

  // Handle other image services that support query parameters
  try {
    const url = new URL(originalUrl);
    
    // Add optimization parameters if the service supports them
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality) url.searchParams.set('q', quality.toString());
    if (format !== 'auto') url.searchParams.set('format', format);
    
    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return originalUrl;
  }
};

/**
 * Generate responsive image sizes
 */
export const generateResponsiveSizes = (
  baseUrl: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536]
) => {
  return breakpoints.map(width => ({
    width,
    url: createOptimizedImageUrl(baseUrl, { width, quality: 85 }),
  }));
};

/**
 * Create srcSet string for responsive images
 */
export const createSrcSet = (
  baseUrl: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536]
): string => {
  const sizes = generateResponsiveSizes(baseUrl, breakpoints);
  return sizes.map(({ width, url }) => `${url} ${width}w`).join(', ');
};

/**
 * Optimize video source based on device capabilities
 */
export const optimizeVideoSource = (
  originalUrl: string,
  deviceCapabilities: {
    isSlowConnection?: boolean;
    saveData?: boolean;
    deviceMemory?: number;
  } = {}
): string => {
  const { isSlowConnection, saveData, deviceMemory = 4 } = deviceCapabilities;

  // For slow connections or save-data preference, return a lower quality or thumbnail
  if (isSlowConnection || saveData || deviceMemory < 2) {
    // If it's a video URL, try to get a thumbnail instead
    if (originalUrl.includes('youtube.com') || originalUrl.includes('youtu.be')) {
      // Extract video ID and return thumbnail
      const videoId = originalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    
    // For other videos, return the original but suggest using poster image
    return originalUrl;
  }

  return originalUrl;
};

/**
 * Memory-efficient array chunking for large datasets
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Lazy load images using Intersection Observer
 */
export const setupLazyLoading = (
  selector: string = 'img[data-lazy]',
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.lazy;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-lazy');
          imageObserver.unobserve(img);
        }
      }
    });
  }, defaultOptions);

  document.querySelectorAll(selector).forEach((img) => {
    imageObserver.observe(img);
  });

  return imageObserver;
};

/**
 * Bundle size optimization - dynamic imports
 */
export const loadComponentLazily = async <T>(
  importFunction: () => Promise<{ default: T }>
): Promise<T> => {
  try {
    const module = await importFunction();
    return module.default;
  } catch (error) {
    console.error('Failed to load component lazily:', error);
    throw error;
  }
};

/**
 * Critical CSS inlining helper
 */
export const inlineCriticalCSS = (css: string) => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
};

/**
 * Resource hints for better loading performance
 */
export const addResourceHints = (resources: Array<{
  href: string;
  rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
  as?: string;
  type?: string;
  crossorigin?: string;
}>) => {
  resources.forEach(({ href, rel, as, type, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    if (type) link.type = type;
    if (crossorigin) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  });
};

/**
 * Service Worker registration for caching
 */
export const registerServiceWorker = async (swPath: string = '/sw.js') => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('SW registered: ', registration);
      return registration;
    } catch (error) {
      console.log('SW registration failed: ', error);
      throw error;
    }
  }
  throw new Error('Service Workers not supported');
};