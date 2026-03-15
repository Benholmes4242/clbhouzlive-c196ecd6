// TrimScreen — Step 3: Video trimmer, full dark cinematic immersion

import React, { useRef, useEffect } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { VideoTrimmer } from '../components/VideoTrimmer';
import { usePostStudioContext } from '../usePostStudio';
import { BG_BASE, TEXT_SECONDARY } from '../tokens';

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
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader title="Trim" step="TRIM" darkMode leftAction={{ label: 'Cancel', onClick: () => setStep('COMPOSER') }} rightAction={{ label: 'Done', onClick: () => setStep('COMPOSER'), variant: 'primary' }} />

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div style={{ aspectRatio: '9/16', maxHeight: '55vh', width: '100%', maxWidth: 320 }} className="relative">
          <video ref={videoRef} src={activeItem.previewUrl} muted playsInline autoPlay loop className="w-full h-full object-cover" style={{ borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.70)' }} />
        </div>
      </div>

      <div className="mx-4 mb-4 p-5" style={{ borderRadius: 28, background: 'rgba(22,22,22,0.95)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 -8px 40px rgba(0,0,0,0.60)' }}>
        <p className="text-[13px] font-medium mb-4 text-center" style={{ color: TEXT_SECONDARY }}>Drag handles to trim</p>
        <VideoTrimmer item={activeItem} onTrimChange={handleTrimChange} darkMode />
      </div>
    </div>
  );
}
