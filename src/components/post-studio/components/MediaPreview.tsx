// MediaPreview — Full-bleed dark media display with cinematic controls

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudioMediaItem } from '../types';

const VIDEO_ASPECT = 16 / 9;
const MAX_ASPECT = 4 / 5; // cap at 4:5 — no taller than this for any media

interface MediaPreviewProps {
  item: StudioMediaItem;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function MediaPreview({ item, onSwipeLeft, onSwipeRight }: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isVideo = item.mediaType === 'video';
  const rawAspect = isVideo ? VIDEO_ASPECT : (item.width ?? 1) / (item.height ?? 1);
  const aspect = Math.max(rawAspect, MAX_ASPECT); // max() because higher ratio = wider/shorter

  const fadeOutControls = useCallback(() => {
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setShowControls(true);
    if (video.paused) { video.play(); setIsPlaying(true); fadeOutControls(); }
    else { video.pause(); setIsPlaying(false); clearTimeout(controlsTimerRef.current); }
  }, [fadeOutControls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    const handleTimeUpdate = () => { if (item.trimEnd != null && video.currentTime >= item.trimEnd) video.currentTime = item.trimStart; };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVideo, item.trimStart, item.trimEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 40) { if (dx < 0) onSwipeLeft?.(); else onSwipeRight?.(); }
  }, [onSwipeLeft, onSwipeRight]);

  if (hasError) {
    return <div className="w-full flex items-center justify-center" style={{ aspectRatio: VIDEO_ASPECT, background: '#111' }}><p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 13 }}>Failed to load</p></div>;
  }

  return (
    <div className="w-full relative" style={{ aspectRatio: aspect, background: '#000', cursor: isVideo ? 'pointer' : 'default' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={isVideo ? togglePlay : undefined}>
      {isVideo ? (
        <>
          <video ref={videoRef} src={item.previewUrl} muted playsInline loop className="w-full h-full object-contain" onError={() => setHasError(true)} />
          <AnimatePresence>
            {showControls && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {isPlaying ? <Pause className="w-6 h-6 text-white" strokeWidth={2} /> : <Play className="w-6 h-6 text-white ml-0.5" strokeWidth={2} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {item.posterPreviewUrl && (
            <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}>Cover set</div>
          )}
          {item.edits && Object.keys(item.edits).some(() => {
            const e = item.edits!;
            return (e.filter && e.filter !== 'normal') || e.textOverlays?.length || e.music || e.crop || e.rotate || e.flipH || e.flipV;
          }) && (
            <div className={`absolute ${item.posterPreviewUrl ? 'top-9' : 'top-2.5'} left-2.5 px-2 py-1 rounded-lg text-[11px] font-semibold`} style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(245,158,11,0.9)' }}>Edited</div>
          )}
        </>
      ) : (
        <>
          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setHasError(true)} />
          {item.edits && Object.keys(item.edits).some(() => {
            const e = item.edits!;
            return (e.filter && e.filter !== 'normal') || e.textOverlays?.length || e.music || e.crop || e.rotate || e.flipH || e.flipV;
          }) && (
            <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(245,158,11,0.9)' }}>Edited</div>
          )}
        </>
      )}
    </div>
  );
}
