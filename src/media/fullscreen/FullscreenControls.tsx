/**
 * FullscreenControls - Apple-style progress bar for video playback
 * 
 * Uses AppleProgressBar from Clubhouse for visual parity.
 * Mute button removed — now handled by CinematicActionRail in FullscreenOverlay.
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { AppleProgressBar } from '@/components/clubhouse/AppleProgressBar';

export interface FullscreenControlsProps {
  className?: string;
}

export const FullscreenControls: React.FC<FullscreenControlsProps> = ({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  
  const videoRef = viewer.activeVideoRef;
  const isVideo = viewer.currentItem?.mediaType === 'video';

  // Subscribe to video time updates
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) {
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration || 0);
    const handleDurationChange = () => setDuration(video.duration || 0);
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
    setCurrentTime(video.currentTime || 0);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [videoRef, videoRef?.current]);

  if (!isVideo) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isScrubbing ? scrubProgress : progress;

  const handleScrubStart = () => {
    setIsScrubbing(true);
  };

  const handleScrubMove = (percent: number) => {
    setScrubProgress(percent);
    // Live seek while scrubbing
    const video = videoRef?.current;
    if (video && duration > 0) {
      video.currentTime = (percent / 100) * duration;
    }
  };

  const handleScrubEnd = () => {
    setIsScrubbing(false);
  };

  return (
    <div
      className={cn(
        'absolute inset-x-0 z-[95] pointer-events-auto px-4',
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
      }}
    >
      <AppleProgressBar
        progress={displayProgress}
        onScrubStart={handleScrubStart}
        onScrubMove={handleScrubMove}
        onScrubEnd={handleScrubEnd}
      />
    </div>
  );
};

export default FullscreenControls;
