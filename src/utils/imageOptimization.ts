// Image optimization utilities for better performance

export const getOptimizedImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return url;
  
  // For Supabase storage URLs, we can add transformation parameters
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const urlObj = new URL(url);
    const params = new URLSearchParams();
    
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', '80'); // Good balance between quality and size
    params.set('format', 'webp'); // Modern format for better compression
    
    if (params.toString()) {
      urlObj.search = params.toString();
    }
    
    return urlObj.toString();
  }
  
  return url;
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
  const screenWidth = window.innerWidth;
  
  if (screenWidth <= 640) { // Mobile
    return { width: 400, height: 400 };
  } else if (screenWidth <= 1024) { // Tablet
    return { width: 600, height: 600 };
  } else { // Desktop
    return { width: 800, height: 800 };
  }
};