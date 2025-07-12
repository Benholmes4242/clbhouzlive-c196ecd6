// Avatar-specific optimization utilities

export const AVATAR_SIZES = {
  xs: 24,
  sm: 32, 
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
  '3xl': 96
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;

// Generate optimized avatar URL with WebP format and proper sizing
export const getOptimizedAvatarUrl = (
  url: string, 
  size: AvatarSize | number = 'md'
): string => {
  if (!url) return '';
  
  const pixels = typeof size === 'number' ? size : AVATAR_SIZES[size];
  
  // For Supabase storage URLs
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('width', pixels.toString());
    urlObj.searchParams.set('height', pixels.toString());
    urlObj.searchParams.set('quality', '85'); // Slightly higher quality for faces
    urlObj.searchParams.set('format', 'webp');
    urlObj.searchParams.set('resize', 'cover'); // Ensure proper cropping
    return urlObj.toString();
  }
  
  // For external URLs, try to add responsive parameters
  if (url.includes('unsplash.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', pixels.toString());
    urlObj.searchParams.set('h', pixels.toString());
    urlObj.searchParams.set('fit', 'crop');
    urlObj.searchParams.set('crop', 'face');
    urlObj.searchParams.set('auto', 'format');
    return urlObj.toString();
  }
  
  return url;
};

// Generate blur placeholder for avatar
export const generateAvatarPlaceholder = (name?: string): string => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];
  const color = colors[initial.charCodeAt(0) % colors.length];
  
  return `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='20' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-family='system-ui' font-size='16' font-weight='600'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

// Batch preload avatars with priority
export const batchPreloadAvatars = (
  urls: string[], 
  size: AvatarSize | number = 'md',
  priority: 'high' | 'medium' | 'low' = 'medium'
) => {
  const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 500;
  
  setTimeout(() => {
    urls.forEach((url, index) => {
      if (!url) return;
      
      // Stagger loading to prevent overwhelming the browser
      setTimeout(() => {
        const img = new Image();
        img.src = getOptimizedAvatarUrl(url, size);
      }, index * 50);
    });
  }, delay);
};