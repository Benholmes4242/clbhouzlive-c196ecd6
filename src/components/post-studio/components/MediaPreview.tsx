// MediaPreview — Main preview pane for active media item
// Video: 16:9, muted inline playback. Image: 1:1.

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { ASPECT_RATIO } from '../constants';
import type { StudioMediaItem } from '../types';

interface MediaPreviewProps {
  item: StudioMediaItem;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function MediaPreview({ item, onSwipeLeft, onSwipeRight }: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const touchStartX = useRef(0);

  const isVideo = item.mediaType === 'video';
  const aspect = isVideo ? ASPECT_RATIO.video : ASPECT_RATIO.image;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setIsPlaying(true); }
    else { video.pause(); setIsPlaying(false); }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    const handleTimeUpdate = () => {
      if (item.trimEnd != null && video.currentTime >= item.trimEnd) video.currentTime = item.trimStart;
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isVideo, item.trimStart, item.trimEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { if (dx < 0) onSwipeLeft?.(); else onSwipeRight?.(); }
  }, [onSwipeLeft, onSwipeRight]);

  if (hasError) {
    return (
      <div className="w-full bg-muted rounded-xl flex items-center justify-center" style={{ aspectRatio: aspect }}>
        <p className="text-muted-foreground text-sm">Failed to load</p>
      </div>
    );
  }

  return (
    <div
      className="w-full relative rounded-xl overflow-hidden bg-[#0A0A0A]"
      style={{ aspectRatio: aspect }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isVideo ? (
        <>
          <video ref={videoRef} src={item.previewUrl} muted playsInline loop className="w-full h-full object-contain" onError={() => setHasError(true)} />
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </div>
          </button>
        </>
      ) : (
        <img src={item.previewUrl} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setHasError(true)} />
      )}
    </div>
  );
}
