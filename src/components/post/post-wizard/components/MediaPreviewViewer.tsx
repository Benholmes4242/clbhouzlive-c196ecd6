import { useState, useCallback, useRef } from 'react';
import { X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderedMediaItem } from '../types';
import { formatDuration } from '@/utils/formatDuration';

interface MediaPreviewViewerProps {
  items: OrderedMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onStudio: (itemId: string) => void;
  onSetCover?: (index: number) => void;
  coverIndex: number;
}

export function MediaPreviewViewer({ items, initialIndex, onClose, onStudio, onSetCover, coverIndex }: MediaPreviewViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const item = items[currentIndex];
  const isCover = currentIndex === coverIndex;

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(items.length - 1, idx)));
  }, [items.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Swipe down to close
    if (dy > 100 && Math.abs(dx) < 80) {
      onClose();
      return;
    }

    // Horizontal swipe to navigate
    if (Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      if (dx < 0 && currentIndex < items.length - 1) {
        goTo(currentIndex + 1);
      } else if (dx > 0 && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    }
  }, [currentIndex, items.length, goTo, onClose]);

  const handleStudio = useCallback(() => {
    if (item) onStudio(item.id);
  }, [item, onStudio]);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[10002] flex flex-col bg-black/95"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-safe-or-4 pb-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
          aria-label="Close preview"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          {/* Set as Cover button — only for non-cover items when multiple */}
          {items.length > 1 && !isCover && (
            <button
              onClick={() => onSetCover?.(currentIndex)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}
            >
              Set as Cover
            </button>
          )}

          <button
            onClick={handleStudio}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
            aria-label="Edit in studio"
          >
            <Wand2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Media display */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex items-center justify-center relative"
          >
            {item.type === 'video' ? (
              <>
                <video
                  src={item.previewUrl}
                  poster={item.thumbnailUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                {item.duration != null && (
                  <div
                    className="absolute bottom-16 left-4 px-2 py-0.5 rounded-md text-white text-xs font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                    }}
                  >
                    {formatDuration(item.duration)}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full overflow-auto" style={{ touchAction: 'pinch-zoom pan-x pan-y' }}>
                <img
                  src={item.previewUrl}
                  className="w-full h-full object-contain"
                  alt=""
                  draggable={false}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-safe-or-6 pt-3 flex-shrink-0">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="w-2 h-2 rounded-full transition-all duration-200"
              style={{
                backgroundColor: idx === currentIndex ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                transform: idx === currentIndex ? 'scale(1.2)' : 'scale(1)',
              }}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
