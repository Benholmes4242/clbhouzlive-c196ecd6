/**
 * Lightbox
 * Fullscreen image viewer with navigation, pinch-zoom, and gestures
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';

// ============================================
// TYPES
// ============================================

export interface LightboxImage {
  id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
  showCounter?: boolean;
  showCaption?: boolean;
  enableZoom?: boolean;
  onIndexChange?: (index: number) => void;
}

// ============================================
// COMPONENT
// ============================================

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  initialIndex = 0,
  onClose,
  showCounter = true,
  showCaption = true,
  enableZoom = true,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { ref: zoomRef, imgRef, style: zoomStyle, scale, reset: resetZoom } = usePinchZoomPointer();
  const isZoomed = scale > 1;

  const currentImage = images[currentIndex];
  const hasNext = currentIndex < images.length - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (hasNext && !isZoomed) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      resetZoom();
      onIndexChange?.(newIndex);
    }
  }, [hasNext, currentIndex, onIndexChange, isZoomed, resetZoom]);

  const goPrev = useCallback(() => {
    if (hasPrev && !isZoomed) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      resetZoom();
      onIndexChange?.(newIndex);
    }
  }, [hasPrev, currentIndex, onIndexChange, isZoomed, resetZoom]);

  // Reset zoom on index change
  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Touch swipe handlers — skip when zoomed
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || isZoomed) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const threshold = 50;

    if (diff > threshold) {
      goNext();
    } else if (diff < -threshold) {
      goPrev();
    }

    setTouchStart(null);
  };

  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Counter */}
        {showCounter && images.length > 1 && (
          <div className="absolute top-4 left-4 z-50 px-3 py-1.5 text-sm text-white/80 bg-black/50 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Previous button */}
        {hasPrev && !isZoomed && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Next button */}
        {hasNext && !isZoomed && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Image container with pinch zoom */}
        <motion.div
          key={currentImage.id}
          className="relative max-w-[90vw] max-h-[85vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div ref={zoomRef} style={zoomStyle}>
            <img
              ref={imgRef}
              src={currentImage.src}
              alt={currentImage.alt || 'Gallery image'}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              draggable={false}
            />
          </div>
        </motion.div>

        {/* Caption */}
        {showCaption && currentImage.caption && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="inline-block px-4 py-2 text-sm text-white bg-black/50 rounded-lg max-w-[80vw]">
              {currentImage.caption}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default Lightbox;
