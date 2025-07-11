
import { useState } from 'react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alt?: string;
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
}

export const useFullscreenMedia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);

  const openMedia = (
    url: string, 
    type: 'image' | 'video', 
    alt?: string, 
    golfCourse?: { id: string; name: string; country: string; },
    user?: { id: string; profile_photo_url: string | null; },
    displayName?: string
  ) => {
    setCurrentMedia({ url, type, alt, golfCourse, user, displayName });
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
