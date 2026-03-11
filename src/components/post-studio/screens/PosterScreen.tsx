// PosterScreen — Step 4: Poster frame selection (video only)
// Full-width video preview frozen at posterTimestamp + PosterPicker filmstrip

import React, { useRef, useEffect } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { PosterPicker } from '../components/PosterPicker';
import { usePostStudioContext } from '../usePostStudio';

export function PosterScreen() {
  const { state, setStep, updatePoster } = usePostStudioContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex];
  if (!activeItem || activeItem.mediaType !== 'video') {
    return null;
  }

  // Freeze at poster timestamp
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = activeItem.posterTimestamp;
    video.pause();
  }, [activeItem.posterTimestamp]);

  const handlePosterChange = (timestamp: number, previewUrl: string | null) => {
    updatePoster(activeItem.id, timestamp, previewUrl);
    // Also seek the preview video
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const handleDone = () => {
    setStep('COMPOSER');
  };

  return (
    <div className="flex-1 flex flex-col">
      <StudioHeader
        title="Cover"
        leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSER') }}
        rightAction={{ label: 'Done', onClick: handleDone, variant: 'primary' }}
      />

      {/* Frozen video preview */}
      <div className="flex-1 flex items-center justify-center bg-black px-4">
        <video
          ref={videoRef}
          src={activeItem.previewUrl}
          muted
          playsInline
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>

      {/* Poster picker */}
      <div className="px-4 py-6 bg-background">
        <PosterPicker item={activeItem} onPosterChange={handlePosterChange} />
      </div>
    </div>
  );
}
