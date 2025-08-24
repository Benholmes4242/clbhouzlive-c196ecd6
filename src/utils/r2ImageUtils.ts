// Utility functions for handling R2 images correctly

export const isR2Url = (url: string): boolean => {
  return url?.includes('media.clbhouz.co.uk') || false;
};

export const isVideoUrl = (url: string): boolean => {
  return url?.includes('cloudflarestream.com') || 
         url?.includes('.m3u8') || 
         url?.includes('.mp4') || 
         url?.includes('.mov') ||
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
  if (!url) return '';
  
  // For video URLs, always return as-is
  if (isVideoUrl(url)) {
    return url;
  }
  
  // R2 CORS is now configured, so R2 images should load in preview
  // Return all URLs as-is (including R2 and Supabase storage)
  return url;
};

export const shouldOptimizeUrl = (url: string): boolean => {
  // Only optimize Supabase storage URLs
  return url?.includes('supabase') && url?.includes('storage') || false;
};