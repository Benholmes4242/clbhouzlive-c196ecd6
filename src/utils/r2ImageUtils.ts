// Utility functions for handling R2 images correctly
import { getR2BucketSource, isValidR2Url } from './r2BucketMapping';

export const isR2Url = (url: string): boolean => {
  return url?.includes('media.clbhouz.co.uk') || false;
};

/**
 * Validates R2 URL compatibility (supports both legacy and new buckets)
 */
export const isCompatibleR2Url = (url: string): boolean => {
  return isValidR2Url(url);
};

/**
 * Gets bucket source type for debugging/monitoring
 */
export const getR2Source = (url: string): 'legacy' | 'new' | 'unknown' => {
  return getR2BucketSource(url);
};

export const isVideoUrl = (url: string): boolean => {
  return url?.includes('cloudflarestream.com') || 
         url?.includes('.m3u8') || 
         url?.includes('.mp4') || 
         url?.includes('.mov') ||
         url?.includes('.webm') ||
         url?.includes('customer-') || false;
};

export const isSupabaseStorageUrl = (url: string): boolean => {
  return url?.includes('supabase.co/storage') || false;
};

export const isPreviewEnvironment = (): boolean => {
  return window.location.hostname.includes('lovable.dev') || 
         window.location.hostname.includes('sandbox');
};

export const getDirectImageUrl = (url: string): string => {
  if (!url) {
    return '';
  }
  
  // For video URLs, always return as-is
  if (isVideoUrl(url)) {
    return url;
  }
  
  // R2 CORS is configured, and both legacy + new buckets are readable
  // Return all URLs as-is (supports backward compatibility)
  return url;
};

export const shouldOptimizeUrl = (url: string): boolean => {
  // Only optimize Supabase storage URLs
  return url?.includes('supabase') && url?.includes('storage') || false;
};