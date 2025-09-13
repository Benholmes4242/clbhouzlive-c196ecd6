import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileMedia } from './useProfileMedia';

// Feature flag to control DVF vs Modal
const USE_DVF = true; // Set to false to use old modal

export const useImmersiveProfile = (userId: string, isOwnProfile: boolean = false) => {
  const navigate = useNavigate();
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [lastVisitedIndex, setLastVisitedIndex] = useState(0);
  const { mediaItems, loading, error, refetch } = useProfileMedia(userId);
  
  const hasImmersiveMedia = mediaItems.length > 0;

  // Auto-open immersive mode for other users (not own profile)
  const shouldAutoOpen = !isOwnProfile && hasImmersiveMedia && !loading;

  const openImmersive = useCallback((startIndex: number = 0) => {
    if (USE_DVF) {
      navigate(`/immersive/${userId}?index=${startIndex}&autoplay=1&mute=1`);
      return;
    }
    // Fallback to old modal
    setCurrentMediaIndex(startIndex);
    setIsImmersiveOpen(true);
  }, [navigate, userId]);

  const closeImmersive = useCallback(() => {
    if (USE_DVF) {
      navigate(-1);
      return;
    }
    // Fallback to old modal
    setLastVisitedIndex(currentMediaIndex);
    setIsImmersiveOpen(false);
  }, [navigate, currentMediaIndex]);

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