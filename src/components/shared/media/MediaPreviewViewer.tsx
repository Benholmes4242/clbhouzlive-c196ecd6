// MediaPreviewViewer — Fullscreen media viewer with swipe
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const item = items[currentIndex];
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 shrink-0">
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
      <div className="flex-1 flex items-center justify-center relative">
        {item.type === 'video' ? (
          <video
            src={item.previewUrl}
            controls
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <img
            src={item.previewUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Nav buttons */}
        {currentIndex > 0 && (
          <button
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="absolute left-2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {currentIndex < items.length - 1 && (
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
