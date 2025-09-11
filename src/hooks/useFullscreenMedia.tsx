
import { useState } from 'react';

import type { MediaItem, PostMediaContext } from '@/types/media';

export const useFullscreenMedia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<PostMediaContext | null>(null);

  const openMedia = (
    url: string | string[], 
    type: 'image' | 'video' | ('image' | 'video')[], 
    alt?: string, 
    golfCourse?: { id: string; name: string; country: string; },
    user?: { id: string; displayName?: string; profile_photo_url?: string | null; },
    displayName?: string,
    content?: string | null,
    postTags?: any[],
    initialIndex: number = 0
  ) => {
    // Handle both single and multiple media
    const mediaUrls = Array.isArray(url) ? url : [url];
    const mediaTypes = (Array.isArray(type) ? type : [type]) as ('image' | 'video')[];

    const items: MediaItem[] = mediaUrls.map((u, i) => ({
      id: `media-${Date.now()}-${i}`,
      type: mediaTypes[i] || 'image',
      url: u,
      alt
    }));
    
    setCurrentMedia({ 
      items,
      mediaUrls,
      mediaTypes,
      golfCourse, 
      user,
      displayName, 
      content, 
      postTags,
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
