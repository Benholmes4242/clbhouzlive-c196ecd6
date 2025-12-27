/**
 * ClubhouseVideoProgressBar - Video progress bar for bottom nav
 * Mirrors the exact progress bar from CinematicVideoCard in Discover Videos
 */

import React, { useEffect } from 'react';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { useClubhouseVideoSafe } from '@/contexts/ClubhouseVideoContext';

interface ClubhouseVideoProgressBarProps {
  className?: string;
}

export const ClubhouseVideoProgressBar: React.FC<ClubhouseVideoProgressBarProps> = ({ className }) => {
  const clubhouseVideo = useClubhouseVideoSafe();
  
  // Get video element from context
  const videoElement = clubhouseVideo?.activeVideoRef.current ?? null;
  
  // Use the same hook as CinematicVideoCard
  const { progress, setProgressFillRef } = useVideoProgressSync(videoElement);
  
  // Don't render if no video context or no video
  if (!clubhouseVideo || !videoElement) {
    return null;
  }

  return (
    <div 
      className={className}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Video progress"
    >
      <div
        ref={setProgressFillRef}
        className="h-full origin-left will-change-transform bg-white/55"
        style={{ transform: 'scaleX(0)' }}
        aria-hidden="true"
      />
    </div>
  );
};

export default ClubhouseVideoProgressBar;
