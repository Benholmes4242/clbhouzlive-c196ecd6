import { useMemo } from 'react';

export interface CourseMediaSummary {
  photoCount: number;
  videoCount: number;
  userMediaCount: number;
  lastMediaCreatedAt: string | null;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  createdAt: string;
  author: {
    id: string;
  };
}

export const useCourseMediaSummary = (
  mediaItems: MediaItem[],
  currentUserId: string | null
): CourseMediaSummary => {
  return useMemo(() => {
    if (!mediaItems || mediaItems.length === 0) {
      return {
        photoCount: 0,
        videoCount: 0,
        userMediaCount: 0,
        lastMediaCreatedAt: null,
      };
    }

    const photoCount = mediaItems.filter((item) => item.type === 'image').length;
    const videoCount = mediaItems.filter((item) => item.type === 'video').length;
    const userMediaCount = currentUserId
      ? mediaItems.filter((item) => item.author.id === currentUserId).length
      : 0;

    // Find most recent media
    const sortedByDate = [...mediaItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastMediaCreatedAt = sortedByDate[0]?.createdAt || null;

    return {
      photoCount,
      videoCount,
      userMediaCount,
      lastMediaCreatedAt,
    };
  }, [mediaItems, currentUserId]);
};
