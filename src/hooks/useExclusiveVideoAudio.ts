import { useEffect, useCallback } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useClubhouseStore } from '@/store/clubhouseStore';

export interface ExclusiveVideoAudio {
  isMuted: boolean;
  isActive: boolean;
  toggleMute: () => void;
}

/**
 * Hook for exclusive video audio control.
 * Uses clubhouseStore as single source of truth for mute state.
 * Uses GlobalAudioContext only for activeVideoId tracking.
 */
export const useExclusiveVideoAudio = (videoId: string): ExclusiveVideoAudio => {
  const { 
    setActiveVideo, 
    isVideoActive, 
  } = useGlobalAudio();

  const isGloballyMuted = useClubhouseStore(s => s.isMuted);
  const setGlobalMute = useClubhouseStore(s => s.setIsMuted);
  const markUserGestureUnmute = useClubhouseStore(s => s.markUserGestureUnmute);
  
  const isMuted = isGloballyMuted || !isVideoActive(videoId);
  const isActive = isVideoActive(videoId);

  const toggleMute = useCallback(() => {
    if (isGloballyMuted) {
      markUserGestureUnmute();
      setGlobalMute(false);
      setActiveVideo(videoId);
    } else if (isActive) {
      setGlobalMute(true);
      setActiveVideo(null);
    } else {
      setActiveVideo(videoId);
    }
  }, [isGloballyMuted, isActive, videoId, setGlobalMute, setActiveVideo, markUserGestureUnmute]);

  useEffect(() => {
    return () => {
      if (isActive) {
        setActiveVideo(null);
      }
    };
  }, [videoId, isActive, setActiveVideo]);

  return {
    isMuted,
    isActive,
    toggleMute
  };
};
