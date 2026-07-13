// MediaPreviewViewer — Fullscreen media viewer with swipe and pinch-zoom
//
// Matches the canonical fullscreen viewer treatment used by FullscreenFeedOverlay:
//   • blurred self-backdrop of the current media (never black), crossfaded on
//     carousel swipe
//   • immersive status-bar bleed via body.route-fullscreen-overlay + shield
//     transparency + Median status-bar style push
//   • edge-to-edge chrome sitting directly on the blurred backdrop
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import type { OrderedMediaItem } from './types';

interface MediaPreviewViewerProps {
  items: OrderedMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onSetCover?: (index: number) => void;
  coverIndex?: number;
  showStudio?: boolean;
}

export function MediaPreviewViewer({
  items,
  initialIndex,
  onClose,
  onSetCover,
  coverIndex = 0,
}: MediaPreviewViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { ref: zoomRef, imgRef, style: zoomStyle, scale, reset: resetZoom } = usePinchZoomPointer();
  const isZoomed = scale > 1;
  const item = items[currentIndex];

  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (!isZoomed && currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1);
    },
    onSwipeRight: () => {
      if (!isZoomed && currentIndex > 0) setCurrentIndex(currentIndex - 1);
    },
    onSwipeDown: () => {
      if (!isZoomed) onClose();
    },
    threshold: 60,
  });

  // Reset zoom on slide change
  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  // Immersive shield — mirrors FullscreenFeedOverlay's open/close hooks so the
  // notch/status bar bleeds under the blurred backdrop. useLayoutEffect so the
  // shield/statusbar mutations land BEFORE first paint.
  useLayoutEffect(() => {
    const shield = document.getElementById('safe-area-shield');
    const prevShield = shield?.style.backgroundColor ?? '';
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;

    document.body.classList.add('route-fullscreen-overlay');
    if (shield) shield.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = '#000000';
    document.body.style.backgroundColor = '#000000';
    try {
      setStatusBarStyleColor('dark', '00000000');
    } catch {}

    return () => {
      document.body.classList.remove('route-fullscreen-overlay');
      if (shield) shield.style.backgroundColor = prevShield;
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
      window.dispatchEvent(new CustomEvent('media-viewer-closed'));
    };
  }, []);

  if (!item) return null;

  const backdropUrl = item.type === 'video' ? item.thumbnailUrl : item.previewUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999]"
      style={{ background: '#000' }}
    >
      {/* Blurred self-backdrop — crossfades on carousel swipe (keyed on url). */}
      <AnimatePresence>
        {backdropUrl && (
          <motion.div
            key={backdropUrl}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${backdropUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.6) saturate(1.2)',
              transform: 'scale(1.2)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Header — absolute so backdrop bleeds under the notch */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 12,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Back"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,0.32)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))',
          }}
        >
          <X className="w-6 h-6 text-white" />
        </button>
        {items.length > 1 && (
          <span
            style={{
              background: 'rgba(0,0,0,0.32)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#ffffff',
              textShadow: '0 1px 8px rgba(0,0,0,0.35)',
            }}
          >
            {currentIndex + 1} / {items.length}
          </span>
        )}
        {onSetCover && currentIndex !== coverIndex ? (
          <button
            onClick={() => onSetCover(currentIndex)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F7931E',
              padding: '7px 14px',
              borderRadius: 24,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(247,147,30,0.30)',
            }}
          >
            <Star className="w-3 h-3" style={{ color: '#ffffff' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Set as Cover</span>
          </button>
        ) : (
          <div className="w-11" />
        )}
      </div>

      {/* Media — absolute inset so image centers in the full viewport (bleeds under the notch) */}
      <div
        ref={swipeRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
      >

        {item.type === 'video' ? (
          <video
            key={item.id}
            src={item.previewUrl}
            poster={item.thumbnailUrl}
            controls
            playsInline
            autoPlay
            className="w-full h-full object-contain"
          />
        ) : (
          <div ref={zoomRef} style={zoomStyle}>
            <img
              ref={imgRef}
              src={item.previewUrl}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {/* Nav buttons — hidden when zoomed */}
        {currentIndex > 0 && !isZoomed && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            aria-label="Previous"
            style={{
              position: 'absolute', left: 8,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.32)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))',
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {currentIndex < items.length - 1 && !isZoomed && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            aria-label="Next"
            style={{
              position: 'absolute', right: 8,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.32)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              filter: 'drop-shadow(0 1px 8px rgba(0,0,0,0.35))',
            }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
