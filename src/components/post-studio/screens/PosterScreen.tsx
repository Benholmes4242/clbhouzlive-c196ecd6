// PosterScreen — Full-bleed cover preview with light chrome + dark canvas
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
    <div className="flex-1 flex flex-col" style={{ background: '#F8FAFC' }}>
      {/* Header — light */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 12px)', minHeight: 52 }}>
        <button onClick={() => setStep('COMPOSE')} style={{ fontSize: 14, fontWeight: 500, color: 'rgba(15,23,42,0.55)' }}>
          Cancel
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Cover</span>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setStep('COMPOSE')}
          className="px-4 py-1.5 rounded-full"
          style={{ background: '#0F172A', color: '#ffffff', fontSize: 14, fontWeight: 700 }}
        >
          Done
        </motion.button>
      </header>

      {/* Full-bleed cover preview — stays dark */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#111' }}>
        <video
          ref={videoRef}
          src={activeItem.previewUrl}
          muted playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 inset-x-0" style={{ height: 70, background: 'linear-gradient(to bottom, rgba(0,0,0,0.30), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0" style={{ height: '30%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />

        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full" style={{
          background: 'rgba(255,255,255,0.92)', color: '#0D0D0D',
          fontSize: 11, fontWeight: 700,
        }}>
          Cover
        </div>

        <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full" style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums',
        }}>
          {fmt(activeItem.posterTimestamp)}
        </div>
      </div>

      {/* Filmstrip scrubber — light */}
      <div style={{
        background: '#ffffff',
        borderTop: '0.5px solid rgba(15,23,42,0.07)',
        padding: '16px 16px 28px',
      }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 11, color: 'rgba(15,23,42,0.45)' }}>0:00</span>
          <div className="px-2.5 py-0.5 rounded-full" style={{
            background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.08)',
            fontSize: 13, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(activeItem.posterTimestamp)}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(15,23,42,0.45)' }}>{fmt(totalDuration)}</span>
        </div>

        <PosterPicker item={activeItem} onPosterChange={handlePosterChange} />

        <p className="text-center mt-3" style={{ fontSize: 11, color: 'rgba(15,23,42,0.45)' }}>
          This frame will be your cover photo on the feed
        </p>
      </div>
    </div>
  );
}
