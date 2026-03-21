import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';
import { useMediaViewer, type MediaViewerItem } from '@/hooks/useMediaViewer';

/* ─── Video slide ─── */
const VideoSlide: React.FC<{ item: MediaViewerItem }> = ({ item }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const hlsRef = useRef<Hls | null>(null);

  const videoSrc = item.hlsUrl || item.mp4Url || item.src || '';

  useEffect(() => {
    const el = ref.current;
    if (!el || !videoSrc) return;

    // HLS
    if (videoSrc.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(el);
        hlsRef.current = hls;
        return () => { hls.destroy(); hlsRef.current = null; };
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = videoSrc;
      }
    } else {
      el.src = videoSrc;
    }
  }, [videoSrc]);

  // autoplay when mounted
  useEffect(() => {
    ref.current?.play().catch(() => {});
  }, [videoSrc]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <video
        ref={ref}
        className="max-w-full max-h-full object-contain"
        playsInline
        autoPlay
        loop
        muted={muted}
        poster={item.thumbnailUrl}
      />
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }}
        className="absolute bottom-6 right-6 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
};

/* ─── Image slide ─── */
const ImageSlide: React.FC<{ item: MediaViewerItem }> = ({ item }) => {
  const src = item.imageUrl || item.src || '';
  return (
    <div className="w-full h-full flex items-center justify-center">
      <img src={src} alt="" className="max-w-full max-h-full object-contain" draggable={false} />
    </div>
  );
};

/* ─── Main overlay ─── */
export const MediaViewerOverlay: React.FC = () => {
  const { isOpen, items, currentIndex, closeViewer, next, prev, goTo } = useMediaViewer();
  console.log('[MediaViewerOverlay] render — isOpen:', isOpen, 'items:', items.length);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    // swipe down to close
    if (dy > 80 && Math.abs(dx) < Math.abs(dy)) {
      closeViewer();
      return;
    }
    // horizontal swipe
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  }, [closeViewer, next, prev]);

  // keyboard nav
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, closeViewer, next, prev]);

  // lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const item = items[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          key="media-viewer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <button
              onClick={closeViewer}
              className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>
            {items.length > 1 && (
              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                {currentIndex + 1} / {items.length}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center">
            {item.type === 'video' ? <VideoSlide item={item} /> : <ImageSlide item={item} />}
          </div>

          {/* Desktop chevrons */}
          {items.length > 1 && currentIndex > 0 && (
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {items.length > 1 && currentIndex < items.length - 1 && (
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white hidden md:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
