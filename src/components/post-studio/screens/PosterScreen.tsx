// PosterScreen — Step 4: Cover frame selection
import React, { useRef, useEffect } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { PosterPicker } from '../components/PosterPicker';
import { usePostStudioContext } from '../usePostStudio';
import { BG_BASE } from '../tokens';

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

  const aspectRatio = activeItem.width && activeItem.height
    ? activeItem.width / activeItem.height
    : 16 / 9;
  const isPortrait = aspectRatio < 1;

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="Cover"
        step="POSTER"
        leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSE') }}
        rightAction={{ label: 'Done', onClick: () => setStep('COMPOSE'), variant: 'primary' }}
      />

      <div className="flex-1 flex items-center justify-center px-5 py-4">
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 20,
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
            aspectRatio: isPortrait ? '4/5' : String(aspectRatio),
            width: isPortrait ? 'auto' : '100%',
            height: isPortrait ? '48vh' : 'auto',
            maxWidth: '100%',
          }}
        >
          <video
            ref={videoRef}
            src={activeItem.previewUrl}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div
        className="mx-4 mb-4 px-5 py-4"
        style={{
          borderRadius: 24,
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <p
          className="text-[12px] font-medium mb-3 text-center uppercase tracking-wide"
          style={{ color: 'rgba(15,23,42,0.35)', letterSpacing: '0.08em' }}
        >
          Drag to choose cover frame
        </p>
        <PosterPicker item={activeItem} onPosterChange={handlePosterChange} />
      </div>
    </div>
  );
}
