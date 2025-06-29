
import { useState } from 'react';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alt?: string;
}

export const useFullscreenMedia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);

  const openMedia = (url: string, type: 'image' | 'video', alt?: string) => {
    setCurrentMedia({ url, type, alt });
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
