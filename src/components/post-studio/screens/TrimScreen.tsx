// TrimScreen — Step 3: Video trimmer, full dark cinematic immersion

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
    <div className="flex-1 flex flex-col" style={{ background: '#0A0A0A' }}>
      <StudioHeader title="Trim" step="TRIM" darkMode leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSER') }} rightAction={{ label: 'Done', onClick: () => setStep('COMPOSER'), variant: 'primary' }} />

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <video ref={videoRef} src={activeItem.previewUrl} muted playsInline autoPlay loop className="max-w-full max-h-full object-contain" style={{ borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.70)' }} />
      </div>

      <div className="mx-4 mb-4 p-5 rounded-[24px]" style={{ background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 -4px 24px rgba(0,0,0,0.40)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Drag handles to trim</p>
        <VideoTrimmer item={activeItem} onTrimChange={handleTrimChange} darkMode />
      </div>
    </div>
  );
}
