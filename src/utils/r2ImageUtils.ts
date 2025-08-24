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
  console.log('🔍 IMAGE DEBUG - Input URL:', url);
  
  if (!url) {
    console.log('🔍 IMAGE DEBUG - Empty URL, returning empty string');
    return '';
  }
  
  // For video URLs, always return as-is
  if (isVideoUrl(url)) {
    console.log('🔍 IMAGE DEBUG - Video URL detected, returning as-is:', url);
    return url;
  }
  
  // Check if it's an R2 URL
  const isR2 = isR2Url(url);
  const isPreview = isPreviewEnvironment();
  console.log('🔍 IMAGE DEBUG - URL analysis:', {
    url,
    isR2,
    isPreview,
    domain: new URL(url).hostname
  });
  
  // R2 CORS is now configured, so R2 images should load in preview
  // Return all URLs as-is (including R2 and Supabase storage)
  console.log('🔍 IMAGE DEBUG - Final URL (CORS configured):', url);
  return url;
};

export const shouldOptimizeUrl = (url: string): boolean => {
  // Only optimize Supabase storage URLs
  return url?.includes('supabase') && url?.includes('storage') || false;
};