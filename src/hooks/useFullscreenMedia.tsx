
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
}

export const useFullscreenMedia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);

  const openMedia = (url: string, type: 'image' | 'video', alt?: string, golfCourse?: { id: string; name: string; country: string; }) => {
    setCurrentMedia({ url, type, alt, golfCourse });
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
