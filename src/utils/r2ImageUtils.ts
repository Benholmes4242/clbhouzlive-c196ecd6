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

export const getDirectImageUrl = (url: string): string => {
  // For R2 URLs and video URLs, return as-is without any optimization
  if (isR2Url(url) || isVideoUrl(url)) {
    return url;
  }
  
  // For other URLs, return as-is (no optimization)
  return url;
};

export const shouldOptimizeUrl = (url: string): boolean => {
  // Only optimize Supabase storage URLs
  return url?.includes('supabase') && url?.includes('storage') || false;
};