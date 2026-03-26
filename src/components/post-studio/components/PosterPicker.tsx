// PosterPicker — Horizontal filmstrip scrubber for poster frame selection, light mode

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TEXT_PRIMARY, TEXT_SECONDARY } from '../tokens';
import type { StudioMediaItem } from '../types';

interface PosterPickerProps {
  item: StudioMediaItem;
  onPosterChange: (timestamp: number, previewUrl: string | null) => void;
  darkMode?: boolean;
}

const FRAME_COUNT = 8;
const FRAME_WIDTH = 56;
const FRAME_HEIGHT = 42;

export function PosterPicker({ item, onPosterChange, darkMode }: PosterPickerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState(item.posterTimestamp);
  const [isDragging, setIsDragging] = useState(false);
  const duration = item.duration ?? 0;

  useEffect(() => {
    if (!duration || duration <= 0) { setIsGenerating(false); return; }
    const video = document.createElement('video');
    video.preload = 'auto'; video.muted = true; video.playsInline = true; video.crossOrigin = 'anonymous';
    video.src = item.previewUrl;
    const canvas = document.createElement('canvas');
    canvas.width = FRAME_WIDTH * 2; canvas.height = FRAME_HEIGHT * 2;
    const ctx = canvas.getContext('2d');
    const timestamps: number[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) timestamps.push((i / (FRAME_COUNT - 1)) * duration);
    const generatedFrames: string[] = [];
    let frameIndex = 0;
    const captureNext = () => {
      if (frameIndex >= timestamps.length || !ctx) { setFrames(generatedFrames); setIsGenerating(false); return; }
      video.currentTime = timestamps[frameIndex];
    };
    video.onseeked = () => {
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      generatedFrames.push(canvas.toDataURL('image/jpeg', 0.6));
      frameIndex++;
      captureNext();
    };
    video.onloadeddata = () => captureNext();
    video.onerror = () => setIsGenerating(false);
    return () => {
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.src = '';
    };
  }, [item.previewUrl, duration]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setCurrentTimestamp(Math.round((x / rect.width) * duration * 10) / 10);
  }, [duration]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setCurrentTimestamp(Math.round((x / rect.width) * duration * 10) / 10);
  }, [isDragging, duration]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const video = videoRef.current;
    if (!video) {
      setTimeout(() => {
        const retryVideo = document.querySelector('video') as HTMLVideoElement | null;
        if (retryVideo) {
          retryVideo.currentTime = currentTimestamp;
          retryVideo.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = retryVideo.videoWidth;
            canvas.height = retryVideo.videoHeight;
            canvas.getContext('2d')?.drawImage(retryVideo, 0, 0);
            onPosterChange(currentTimestamp, canvas.toDataURL('image/jpeg', 0.85));
            retryVideo.onseeked = null;
          };
        } else {
          onPosterChange(currentTimestamp, null);
        }
      }, 150);
      return;
    }
    video.currentTime = currentTimestamp;
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      onPosterChange(currentTimestamp, canvas.toDataURL('image/jpeg', 0.85));
      video.onseeked = null;
    };
  }, [isDragging, currentTimestamp, onPosterChange]);

  const scrubPercent = duration > 0 ? (currentTimestamp / duration) * 100 : 0;

  return (
    <div className="w-full space-y-3">
      <video ref={videoRef} src={item.previewUrl} muted playsInline className="hidden" />

      <div
        ref={containerRef}
        className="relative h-[56px] rounded-xl overflow-hidden touch-none select-none cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.04)' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex h-full">
          {isGenerating
            ? Array.from({ length: FRAME_COUNT }).map((_, i) => (
                <div key={i} className="flex-1 h-full animate-pulse" style={{ background: 'rgba(0,0,0,0.04)', animationDelay: `${i * 0.1}s` }} />
              ))
            : frames.map((frame, i) => (
                <img key={i} src={frame} alt="" className="flex-1 h-full object-cover rounded-lg" draggable={false} />
              ))}
        </div>

        <div
          className="absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none"
          style={{
            left: `${scrubPercent}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.85)',
            boxShadow: '0 0 6px rgba(15,23,42,0.15)',
          }}
        >
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
            style={{
              background: 'rgba(15,23,42,0.90)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '2px solid rgba(255,255,255,0.70)',
            }}
          />
        </div>
      </div>

      <p className="text-center text-xs" style={{ color: TEXT_SECONDARY }}>{formatTimestamp(currentTimestamp)}</p>
    </div>
  );
}

function formatTimestamp(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
