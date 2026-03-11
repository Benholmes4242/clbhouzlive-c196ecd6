// TrimScreen — Step 3: Video trim UI
// Full dark immersive mode with amber-glow handles

import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    video.currentTime = trimStart;
    const handleTimeUpdate = () => {
      if (video.currentTime >= trimEnd) video.currentTime = trimStart;
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVideo, trimStart, trimEnd]);

  if (!activeItem || !isVideo) return null;

  const handleTrimChange = (newStart: number, newEnd: number) => {
    updateTrim(activeItem.id, newStart, newEnd);
    if (videoRef.current) videoRef.current.currentTime = newStart;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A]">
      <StudioHeader
        title="Trim"
        step="TRIM"
        darkMode
        leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSER') }}
        rightAction={{ label: 'Done', onClick: () => setStep('COMPOSER'), variant: 'primary' }}
      />

      <div className="flex-1 flex items-center justify-center px-4">
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

      <div className="bg-[#1A1A1A] rounded-2xl mx-4 mb-4 p-4">
        <VideoTrimmer item={activeItem} onTrimChange={handleTrimChange} darkMode />
      </div>
    </div>
  );
}
