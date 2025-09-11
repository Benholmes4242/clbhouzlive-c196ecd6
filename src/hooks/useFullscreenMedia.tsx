
import { useState } from 'react';

import { MediaItem as BaseMediaItem } from '@/types/media';

interface MediaItem extends BaseMediaItem {
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
  user?: {
    id: string;
    profile_photo_url: string | null;
  };
  displayName?: string;
  content?: string | null;
  postTags?: any[];
  mediaUrls?: string[];
  mediaTypes?: ('image' | 'video')[];
  initialIndex?: number;
}

export const useFullscreenMedia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);

  const openMedia = (
    url: string | string[], 
    type: 'image' | 'video' | ('image' | 'video')[], 
    alt?: string, 
    golfCourse?: { id: string; name: string; country: string; },
    user?: { id: string; profile_photo_url: string | null; },
    displayName?: string,
    content?: string | null,
    postTags?: any[],
    initialIndex: number = 0
  ) => {
    // Handle both single and multiple media
    const mediaUrls = Array.isArray(url) ? url : [url];
    const mediaTypes = Array.isArray(type) ? type : [type];
    
    setCurrentMedia({ 
      id: `media-${Date.now()}`,
      url: mediaUrls[initialIndex], 
      type: mediaTypes[initialIndex], 
      alt, 
      golfCourse, 
      user, 
      displayName, 
      content, 
      postTags,
      mediaUrls,
      mediaTypes,
      initialIndex
    });
    setIsOpen(true);
  };

  const closeMedia = () => {
    setIsOpen(false);
    setCurrentMedia(null);
  };

  return {
    isOpen,
    currentMedia,
    openMedia,
    closeMedia
  };
};
