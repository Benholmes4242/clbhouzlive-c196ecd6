// TrimScreen — Step 3: Video trim UI
// Full-width video preview with VideoTrimmer handles

import React, { useRef, useEffect, useMemo } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { VideoTrimmer } from '../components/VideoTrimmer';
import { usePostStudioContext } from '../usePostStudio';

export function TrimScreen() {
  const { state, setStep, updateTrim } = usePostStudioContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex];
  const isVideo = activeItem?.mediaType === 'video';

  const trimStart = isVideo ? activeItem.trimStart : 0;
  const trimEnd = isVideo ? (activeItem.trimEnd ?? activeItem.duration ?? 0) : 0;

  // Enforce trim range on video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    video.currentTime = trimStart;

    const handleTimeUpdate = () => {
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVideo, trimStart, trimEnd]);

  if (!activeItem || !isVideo) {
    return null;
  }

  const handleTrimChange = (newStart: number, newEnd: number) => {
    updateTrim(activeItem.id, newStart, newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <StudioHeader
        title="Trim"
        leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSER') }}
        rightAction={{ label: 'Done', onClick: () => setStep('COMPOSER'), variant: 'primary' }}
      />

      <div className="flex-1 flex items-center justify-center bg-black px-4">
        <video
          ref={videoRef}
          src={activeItem.previewUrl}
          muted
          playsInline
          autoPlay
          loop
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>

      <div className="px-4 py-6 bg-background">
        <VideoTrimmer item={activeItem} onTrimChange={handleTrimChange} />
      </div>
    </div>
  );
}
