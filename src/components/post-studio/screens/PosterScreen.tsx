// PosterScreen — Step 4: Poster frame selection (video only)
// Dark immersive mode matching TrimScreen

import React, { useRef, useEffect } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { PosterPicker } from '../components/PosterPicker';
import { usePostStudioContext } from '../usePostStudio';

export function PosterScreen() {
  const { state, setStep, updatePoster } = usePostStudioContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex];
  const isVideo = activeItem?.mediaType === 'video';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    video.currentTime = activeItem.posterTimestamp;
    video.pause();
  }, [isVideo, activeItem?.posterTimestamp]);

  if (!activeItem || !isVideo) return null;

  const handlePosterChange = (timestamp: number, previewUrl: string | null) => {
    updatePoster(activeItem.id, timestamp, previewUrl);
    if (videoRef.current) videoRef.current.currentTime = timestamp;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A]">
      <StudioHeader
        title="Cover"
        step="POSTER"
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
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl mx-4 mb-4 p-4">
        <PosterPicker item={activeItem} onPosterChange={handlePosterChange} darkMode />
      </div>
    </div>
  );
}
