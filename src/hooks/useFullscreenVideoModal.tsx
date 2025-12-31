import { useState, useCallback } from 'react';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

interface VideoModalData {
  src: string;
  poster?: string;
  user: {
    id: string;
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
  };
  content?: string;
  studioEdit?: any | null;  // Single object for single-video modal (legacy per-media edits)
  postMusic?: any | null;   // Post-level music (new - takes priority)
  audioMode?: 'original' | 'music_only' | null;
}

/**
 * Hook for managing fullscreen video modal state.
 * Pauses all playing media when modal opens.
 */
export const useFullscreenVideoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [videoData, setVideoData] = useState<VideoModalData | null>(null);

  const openModal = useCallback((data: VideoModalData) => {
    // Pause all videos when opening modal via MediaRuntime
    MediaRuntime.pauseAll();
    setVideoData(data);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setVideoData(null);
  }, []);

  return {
    isOpen,
    videoData,
    openModal,
    closeModal
  };
};
