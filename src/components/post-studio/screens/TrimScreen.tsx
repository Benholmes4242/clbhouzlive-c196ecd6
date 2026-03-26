// TrimScreen — Step 3: Video trimmer
import React, { useRef, useEffect } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { VideoTrimmer } from '../components/VideoTrimmer';
import { usePostStudioContext } from '../usePostStudio';
import { BG_BASE } from '../tokens';

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

  const aspectRatio = activeItem.width && activeItem.height
    ? activeItem.width / activeItem.height
    : 16 / 9;
  const isPortrait = aspectRatio < 1;

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="Trim"
        step="TRIM"
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
            autoPlay
            loop
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
          Drag handles to trim
        </p>
        <VideoTrimmer item={activeItem} onTrimChange={handleTrimChange} />
      </div>
    </div>
  );
}
