// Profile page performance optimizations
import { preloadImage } from './imageOptimization';

// Preload critical profile assets immediately
export const preloadCriticalProfileAssets = async (profile: any) => {
  if (!profile) return;

  const criticalAssets: string[] = [];
  
  // Add profile photo with optimized parameters
  if (profile.profile_photo_url) {
    criticalAssets.push(
      `${profile.profile_photo_url}?quality=100&format=auto&width=1280&height=720&fit=cover`,
      `${profile.profile_photo_url}?quality=100&format=auto&width=2048&height=2048&fit=cover`,
      `${profile.profile_photo_url}?quality=90&format=auto&width=256&height=256&fit=cover`
    );
  }

  // Add profile video thumbnail if available
  if (profile.profile_video_thumbnail_url) {
    criticalAssets.push(profile.profile_video_thumbnail_url);
  }

  // Preload all critical assets with high priority
  const preloadPromises = criticalAssets.map(url => 
    preloadImage(url, true).catch(err => console.warn('Failed to preload:', url, err))
  );

  // Don't await - let them load in background
  Promise.allSettled(preloadPromises).then(results => {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Profile assets preloaded: ${successful}/${criticalAssets.length}`);
  });
};

// Preload common achievement badges (most frequently shown)
export const preloadCommonBadges = () => {
  const commonBadges = [
    'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/20-club-badge.png',
    'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/50-club-badge.png',
    'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/100-club-badge.png',
    'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/birdie-blitz-badge.png',
    'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/usa-explorer-badge.png',
    'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/eu-explorer-badge.png'
  ];

  // Preload in background with lower priority
  commonBadges.forEach(url => {
    preloadImage(url, false).catch(err => console.warn('Failed to preload badge:', url));
  });
};

// Create optimized image URL with CDN parameters
export const getOptimizedProfileImageUrl = (
  originalUrl: string,
  width?: number,
  height?: number,
  quality: number = 90,
  format: string = 'auto'
): string => {
  if (!originalUrl) return originalUrl;
  
  try {
    const url = new URL(originalUrl);
    
    // Add optimization parameters
    if (width) url.searchParams.set('width', width.toString());
    if (height) url.searchParams.set('height', height.toString());
    url.searchParams.set('fit', 'cover');
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('format', format);
    
    return url.toString();
  } catch (error) {
    console.warn('Failed to optimize profile image URL:', error);
    return originalUrl;
  }
};

// Batch preload multiple profile images with different sizes
export const batchPreloadProfileImages = (profilePhotoUrl: string) => {
  if (!profilePhotoUrl) return;

  const sizes = [
    { width: 256, height: 256, priority: true }, // Avatar size
    { width: 512, height: 512, priority: true }, // Medium display
    { width: 1280, height: 720, priority: false }, // Header background
    { width: 2048, height: 2048, priority: false } // High-res display
  ];

  sizes.forEach(({ width, height, priority }) => {
    const optimizedUrl = getOptimizedProfileImageUrl(profilePhotoUrl, width, height, priority ? 95 : 85);
    preloadImage(optimizedUrl, priority).catch(err => 
      console.warn(`Failed to preload ${width}x${height} profile image:`, err)
    );
  });
};