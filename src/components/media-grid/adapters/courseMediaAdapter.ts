import { MediaItem } from '../types';

// Adapter for course media from ExploreContentItem format
export const adaptExploreContentToMediaItems = (exploreItems: any[]): MediaItem[] => {
  return exploreItems.map(item => ({
    id: item.id,
    type: item.type as 'video' | 'image',
    src: item.src,
    title: item.title,
    alt: item.title || '',
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
  }));
};

// Adapter for raw course review media
export const adaptCourseReviewMedia = (courseMedia: any[]): MediaItem[] => {
  return courseMedia.map(media => ({
    id: media.id,
    type: media.media_type as 'video' | 'image',
    src: media.media_url,
    title: media.file_name || '',
    alt: media.file_name || 'Course media'
  }));
};