import { useEffect, useCallback } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

export interface ExclusiveVideoAudio {
  isMuted: boolean;
  isActive: boolean;
  toggleMute: () => void;
}

/**
 * Hook for exclusive video audio control.
 * Uses ONLY GlobalAudioContext as single source of truth for mute state.
 * Fixes the dual-state bug where useSoundPreference conflicted with GlobalAudioContext.
 */
export const useExclusiveVideoAudio = (videoId: string): ExclusiveVideoAudio => {
  const { 
    setActiveVideo, 
    isVideoActive, 
    isGloballyMuted, 
    setGlobalMute,
    markUserGestureUnmute
  } = useGlobalAudio();
  
  // This video is considered muted if either:
  // 1. The global audio is muted, OR
  // 2. This video is not the currently active video
  const isMuted = isGloballyMuted || !isVideoActive(videoId);
  const isActive = isVideoActive(videoId);

  const toggleMute = useCallback(() => {
    if (isGloballyMuted) {
      // If globally muted, unmute and make this video active
      markUserGestureUnmute();
      setGlobalMute(false);
      setActiveVideo(videoId);
    } else if (isActive) {
      // If this video is active and not globally muted, mute globally
      setGlobalMute(true);
      setActiveVideo(null);
    } else {
      // If another video is active, switch to this one
      setActiveVideo(videoId);
    }
  }, [isGloballyMuted, isActive, videoId, setGlobalMute, setActiveVideo]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Only clear active video if this video was the active one
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