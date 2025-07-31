import { useState, useEffect, useCallback } from 'react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useSoundPreference } from './useSoundPreference';

export interface ExclusiveVideoAudio {
  isMuted: boolean;
  isActive: boolean;
  toggleMute: () => void;
}

export const useExclusiveVideoAudio = (videoId: string): ExclusiveVideoAudio => {
  const { activeVideoId, setActiveVideo, isVideoActive } = useGlobalAudio();
  const { isMuted: globalMuted, setMuted: setGlobalMuted } = useSoundPreference();
  
  // This video is considered muted if either:
  // 1. The global sound preference is muted, OR
  // 2. This video is not the currently active video
  const isMuted = globalMuted || !isVideoActive(videoId);
  const isActive = isVideoActive(videoId);

  const toggleMute = useCallback(() => {
    if (globalMuted) {
      // If globally muted, unmute and make this video active
      setGlobalMuted(false);
      setActiveVideo(videoId);
      console.log(`🔊 Unmuted video ${videoId} and set as active`);
    } else if (isActive) {
      // If this video is active and not globally muted, mute globally
      setGlobalMuted(true);
      setActiveVideo(null);
      console.log(`🔇 Muted active video ${videoId}`);
    } else {
      // If another video is active, switch to this one
      setActiveVideo(videoId);
      console.log(`🔄 Switched active video to ${videoId}`);
    }
  }, [globalMuted, isActive, videoId, setGlobalMuted, setActiveVideo]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Only clear active video if this video was the active one
      if (isActive) {
        setActiveVideo(null);
        console.log(`🧹 Cleaned up active video ${videoId}`);
      }
    };
  }, [videoId, isActive, setActiveVideo]);

  return {
    isMuted,
    isActive,
    toggleMute
  };
};