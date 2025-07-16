// Utility to validate video sources and filter out corrupted ones

const KNOWN_FAILED_VIDEOS = new Set([
  '75cb4c14-d76b-4d44-94bf-ed11f5ea77cd',
  'bd6097d5-cb64-46b5-94e2-a43e192cfdd2'
]);

// Extract video ID from Cloudflare Stream URL
export const extractVideoIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle Cloudflare Stream URLs
  const cloudflareMatch = url.match(/\/([a-f0-9-]{36})\//);
  if (cloudflareMatch) {
    return cloudflareMatch[1];
  }
  
  // Handle direct video URLs - use filename as ID
  const directMatch = url.match(/\/([^\/]+)\.(mp4|webm|mov|avi)(\?|$)/i);
  if (directMatch) {
    return directMatch[1];
  }
  
  return null;
};

// Check if a video source is known to be corrupted
export const isVideoSourceCorrupted = (videoUrl: string): boolean => {
  const videoId = extractVideoIdFromUrl(videoUrl);
  return videoId ? KNOWN_FAILED_VIDEOS.has(videoId) : false;
};

// Validate video source URL format
export const isValidVideoSource = (videoUrl: string): boolean => {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return false;
  }
  
  // Check for known corrupted videos
  if (isVideoSourceCorrupted(videoUrl)) {
    console.warn(`🚫 Filtering out known corrupted video: ${videoUrl}`);
    return false;
  }
  
  // Check for valid video URL patterns
  const validPatterns = [
    /\.mp4($|\?)/i,
    /\.webm($|\?)/i,
    /\.mov($|\?)/i,
    /\.avi($|\?)/i,
    /\/manifest\/video\.m3u8($|\?)/i, // HLS streams
    /cloudflarestream\.com/i
  ];
  
  const isValid = validPatterns.some(pattern => pattern.test(videoUrl));
  
  if (!isValid) {
    console.warn(`🚫 Invalid video source format: ${videoUrl}`);
  }
  
  return isValid;
};

// Filter array of posts/media to remove items with corrupted video sources
export const filterValidVideoSources = <T extends { post_media?: Array<{ media_url: string; media_type: string }> }>(
  posts: T[]
): T[] => {
  return posts.filter(post => {
    if (!post.post_media || post.post_media.length === 0) {
      return true; // Keep posts without media
    }
    
    // Check if any video media has valid sources
    const videoMedia = post.post_media.filter(media => media.media_type === 'video');
    if (videoMedia.length === 0) {
      return true; // Keep posts with no video media
    }
    
    // Filter out posts where ALL videos are corrupted
    const hasValidVideo = videoMedia.some(media => isValidVideoSource(media.media_url));
    
    if (!hasValidVideo) {
      console.warn(`🚫 Filtering out post with corrupted video sources:`, post);
    }
    
    return hasValidVideo;
  });
};

// Clean media array to remove corrupted video sources
export const cleanMediaSources = (media: Array<{ media_url: string; media_type: string }>) => {
  return media.filter(item => {
    if (item.media_type !== 'video') {
      return true; // Keep non-video media
    }
    
    return isValidVideoSource(item.media_url);
  });
};