import { ExtendedMediaItem } from '../types';

// Helper to extract Stream UID and generate poster URL
const getVideoPosterUrl = (videoUrl: string, mediaArray?: any[]): string | null => {
  // First check if media array has a thumbnail
  if (mediaArray && mediaArray.length > 0 && mediaArray[0].media_url) {
    return mediaArray[0].media_url;
  }
  
  // Try to extract Stream UID from HLS URL and generate poster
  try {
    const url = new URL(videoUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    const streamUid = parts[0];
    if (streamUid) {
      return `https://videodelivery.net/${streamUid}/thumbnails/thumbnail.jpg?height=600`;
    }
  } catch {
    // Fall back to video URL itself
  }
  
  return null;
};

// Parse duration string (e.g., "1:23" or "0:45") to seconds
const parseDurationToSeconds = (durationStr?: string): number | undefined => {
  if (!durationStr) return undefined;
  
  const parts = durationStr.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) {
    const [mins, secs] = parts;
    return mins * 60 + secs;
  }
  return undefined;
};

// Adapter for course media from ExploreContentItem format
export const adaptExploreContentToMediaItems = (exploreItems: any[]): ExtendedMediaItem[] => {
  return exploreItems.map(item => {
    const isVideo = item.type === 'video';
    const posterUrl = isVideo ? getVideoPosterUrl(item.src, item.media) : null;
    const durationSeconds = parseDurationToSeconds(item.duration);
    
    return {
      id: item.id,
      type: item.type as 'video' | 'image',
      url: item.src,
      posterUrl,
      title: item.title,
      alt: item.title || '',
      duration: durationSeconds,
      user: item.user ? {
        id: item.user.id,
        name: item.user.name,
        username: item.user.username,
        avatar: item.user.avatar
      } : undefined,
      golfCourse: item.golfCourse ? {
        id: item.golfCourse.id,
        name: item.golfCourse.name,
        country: item.golfCourse.country
      } : undefined
    };
  });
};

// Adapter for raw course review media
export const adaptCourseReviewMedia = (courseMedia: any[]): ExtendedMediaItem[] => {
  return courseMedia.map(media => ({
    id: media.id,
    type: media.media_type as 'video' | 'image',
    url: media.media_url,
    title: media.file_name || '',
    alt: media.file_name || 'Course media'
  }));
};