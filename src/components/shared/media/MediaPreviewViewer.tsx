// MediaPreviewViewer — Fullscreen media viewer with swipe and pinch-zoom
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
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

  // Reset zoom on slide change
  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  // Signal pages to re-apply status bar when viewer unmounts
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('media-viewer-closed'));
    };
  }, []);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)', paddingLeft: 16, paddingRight: 16, paddingBottom: 12 }}>
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white text-sm">
          {currentIndex + 1} / {items.length}
        </span>
        {onSetCover && currentIndex !== coverIndex && (
          <button
            onClick={() => onSetCover(currentIndex)}
            className="flex items-center gap-1 text-white text-xs bg-white/20 px-3 py-1.5 rounded-full"
          >
            <Star className="w-3 h-3" /> Cover
          </button>
        )}
        {(!onSetCover || currentIndex === coverIndex) && <div className="w-11" />}
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center relative" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}>
        {item.type === 'video' ? (
          <video
            src={item.previewUrl}
            controls
            playsInline
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
            className="absolute left-2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {currentIndex < items.length - 1 && !isZoomed && (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="absolute right-2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
