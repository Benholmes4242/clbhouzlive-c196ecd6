// TrimScreen — Dark, full-bleed video preview with white waveform trimmer
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { VideoTrimmer } from '../components/VideoTrimmer';
import { usePostStudioContext } from '../usePostStudio';

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function TrimScreen() {
  const { state, setStep, updateTrim } = usePostStudioContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const activeItem = state.mediaItems[state.activeMediaIndex];
  const isVideo = activeItem?.mediaType === 'video';
  const trimStart = isVideo ? activeItem.trimStart : 0;
  const trimEnd = isVideo ? (activeItem.trimEnd ?? activeItem.duration ?? 0) : 0;
  const totalDuration = activeItem?.duration ?? 0;
  const clipDuration = trimEnd - trimStart;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    video.currentTime = trimStart;
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.currentTime >= trimEnd) video.currentTime = trimStart;
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVideo, trimStart, trimEnd]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }, []);

  if (!activeItem || !isVideo) return null;

  const handleTrimChange = (newStart: number, newEnd: number) => {
    updateTrim(activeItem.id, newStart, newEnd);
    if (videoRef.current) videoRef.current.currentTime = newStart;
  };

  return (
    <div className="flex-1 flex flex-col" style={{ background: '#0D0D0D', minHeight: 0, overflow: 'hidden' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)', minHeight: 52 }}>
        <button onClick={() => setStep('COMPOSE')} style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
          Cancel
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Trim</span>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setStep('COMPOSE')}
          className="px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#0D0D0D', fontSize: 14, fontWeight: 700 }}
        >
          Done
        </motion.button>
      </header>

      {/* Full-bleed video preview */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#111', marginTop: 12 }}>
        <video
          ref={videoRef}
          src={activeItem.previewUrl}
          muted playsInline autoPlay loop
          className="w-full h-full object-cover"
        />
        {/* Top scrim */}
        <div className="absolute top-0 inset-x-0" style={{ height: 70, background: 'linear-gradient(to bottom, rgba(0,0,0,0.40), transparent)' }} />
        {/* Bottom scrim */}
        <div className="absolute bottom-0 inset-x-0" style={{ height: '30%', background: 'linear-gradient(to top, rgba(0,0,0,0.70), transparent)' }} />

        {/* Play/pause */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="flex items-center justify-center" style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.90)',
            boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
          }}>
            {isPlaying
              ? <Pause className="w-6 h-6" style={{ color: '#0D0D0D' }} fill="#0D0D0D" />
              : <Play className="w-6 h-6 ml-0.5" style={{ color: '#0D0D0D' }} fill="#0D0D0D" />
            }
          </div>
        </button>

        {/* Playback timer — bottom left */}
        <div className="absolute bottom-3 left-3 z-10" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(currentTime - trimStart)} / {fmt(clipDuration)}
        </div>

        {/* Clip duration badge — bottom right */}
        <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full" style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
        }}>
          {fmt(clipDuration)} clip
        </div>
      </div>

      {/* Trim controls */}
      <div className="shrink-0" style={{
        background: 'rgba(12,12,12,0.98)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 16px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
      }}>
        {/* Timestamp row */}
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontVariantNumeric: 'tabular-nums' }}>{fmt(trimStart)}</p>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Drag handles to trim</span>
          <div className="text-right">
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End</span>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontVariantNumeric: 'tabular-nums' }}>{fmt(trimEnd)}</p>
          </div>
        </div>

        <VideoTrimmer item={activeItem} onTrimChange={handleTrimChange} />

        {/* Full duration row */}
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>0:00</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Full video: {fmt(totalDuration)}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{fmt(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
