// PosterScreen — Step 4: Cover frame selection, dark immersive

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
    <div className="flex-1 flex flex-col" style={{ background: '#0A0A0A' }}>
      <StudioHeader title="Cover" step="POSTER" darkMode leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSER') }} rightAction={{ label: 'Done', onClick: () => setStep('COMPOSER'), variant: 'primary' }} />

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <video ref={videoRef} src={activeItem.previewUrl} muted playsInline className="max-w-full max-h-full object-contain" style={{ borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.70)' }} />
      </div>

      <div className="mx-4 mb-4 p-5 rounded-[24px]" style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 -4px 24px rgba(0,0,0,0.40)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Drag to choose cover frame</p>
        <PosterPicker item={activeItem} onPosterChange={handlePosterChange} darkMode />
      </div>
    </div>
  );
}
