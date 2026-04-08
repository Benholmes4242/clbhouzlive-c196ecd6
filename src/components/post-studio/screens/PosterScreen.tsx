// PosterScreen — Dark, full-bleed cover preview with amber filmstrip needle
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PosterPicker } from '../components/PosterPicker';
import { usePostStudioContext } from '../usePostStudio';

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function PosterScreen() {
  const { state, setStep, updatePoster } = usePostStudioContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex];
  const isVideo = activeItem?.mediaType === 'video';
  const totalDuration = activeItem?.duration ?? 0;

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
    <div className="flex-1 flex flex-col" style={{ background: '#0D0D0D' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 12px)', minHeight: 52 }}>
        <button onClick={() => setStep('COMPOSE')} style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
          Cancel
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Cover</span>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setStep('COMPOSE')}
          className="px-4 py-1.5 rounded-full"
          style={{ background: '#F7931E', color: '#fff', fontSize: 14, fontWeight: 700 }}
        >
          Done
        </motion.button>
      </header>

      {/* Full-bleed cover preview */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#111' }}>
        <video
          ref={videoRef}
          src={activeItem.previewUrl}
          muted playsInline
          className="w-full h-full object-cover"
        />
        {/* Top scrim */}
        <div className="absolute top-0 inset-x-0" style={{ height: 70, background: 'linear-gradient(to bottom, rgba(0,0,0,0.30), transparent)' }} />
        {/* Bottom scrim */}
        <div className="absolute bottom-0 inset-x-0" style={{ height: '30%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />

        {/* "Cover" badge — top left */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full" style={{
          background: 'rgba(255,255,255,0.92)', color: '#0D0D0D',
          fontSize: 11, fontWeight: 700,
        }}>
          Cover
        </div>

        {/* Timestamp badge — bottom right */}
        <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full" style={{
          background: 'rgba(247,147,30,0.18)', border: '1px solid rgba(247,147,30,0.30)',
          fontSize: 12, fontWeight: 600, color: '#F7931E', fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(activeItem.posterTimestamp)}
        </div>
      </div>

      {/* Filmstrip scrubber */}
      <div style={{
        background: 'rgba(12,12,12,0.98)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 16px 28px',
      }}>
        {/* Timestamp row */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>0:00</span>
          <div className="px-2.5 py-0.5 rounded-full" style={{
            background: 'rgba(247,147,30,0.18)', border: '1px solid rgba(247,147,30,0.30)',
            fontSize: 13, fontWeight: 700, color: '#F7931E', fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(activeItem.posterTimestamp)}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{fmt(totalDuration)}</span>
        </div>

        <PosterPicker item={activeItem} onPosterChange={handlePosterChange} />

        <p className="text-center mt-3" style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
          This frame will be your cover photo on the feed
        </p>
      </div>
    </div>
  );
}
