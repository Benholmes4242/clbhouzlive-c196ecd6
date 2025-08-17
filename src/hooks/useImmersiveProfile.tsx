import { useState, useCallback, useRef } from 'react';
import { useProfileMedia } from './useProfileMedia';

export const useImmersiveProfile = (userId: string, isOwnProfile: boolean = false) => {
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [lastVisitedIndex, setLastVisitedIndex] = useState(0);
  const { mediaItems, loading, error, refetch } = useProfileMedia(userId);
  
  const hasImmersiveMedia = mediaItems.length > 0;

  // Auto-open immersive mode for other users (not own profile)
  const shouldAutoOpen = !isOwnProfile && hasImmersiveMedia && !loading;

  const openImmersive = useCallback((startIndex: number = 0) => {
    setCurrentMediaIndex(startIndex);
    setIsImmersiveOpen(true);
  }, []);

  const closeImmersive = useCallback(() => {
    setLastVisitedIndex(currentMediaIndex);
    setIsImmersiveOpen(false);
  }, [currentMediaIndex]);

  const reopenImmersive = useCallback(() => {
    openImmersive(lastVisitedIndex);
  }, [lastVisitedIndex, openImmersive]);

  // Preview mode (for own profile)
  const previewImmersive = useCallback(() => {
    openImmersive(0);
  }, [openImmersive]);

  return {
    // State
    isImmersiveOpen,
    currentMediaIndex,
    hasImmersiveMedia,
    mediaItems,
    loading,
    error,
    shouldAutoOpen,
    
    // Actions
    openImmersive,
    closeImmersive,
    reopenImmersive,
    previewImmersive,
    refetch,
    
    // Setters for external control
    setCurrentMediaIndex
  };
};