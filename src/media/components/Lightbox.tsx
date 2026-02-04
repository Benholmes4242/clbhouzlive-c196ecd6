/**
 * Lightbox
 * Fullscreen image viewer with navigation, zoom, and gestures
 * 
 * Uses ImmersiveLayout for safe area handling
 * 
 * Features:
 * - Fullscreen overlay with dark background
 * - Navigation arrows (left/right)
 * - Keyboard navigation (arrow keys, escape)
 * - Touch swipe gestures
 * - Image counter (1/5)
 * - Optional caption display
 * - Zoom in/out support
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImmersiveLayout } from '@/components/layout/ImmersiveLayout';
import { SAFE_AREA } from '@/constants/safeArea';

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
  /** Array of images to display */
  images: LightboxImage[];
  /** Initial image index (default: 0) */
  initialIndex?: number;
  /** Close callback */
  onClose: () => void;
  /** Show image counter (default: true) */
  showCounter?: boolean;
  /** Show caption (default: true) */
  showCaption?: boolean;
  /** Enable zoom (default: true) */
  enableZoom?: boolean;
  /** Callback when index changes */
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const currentImage = images[currentIndex];
  const hasNext = currentIndex < images.length - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (hasNext) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setIsZoomed(false);
      onIndexChange?.(newIndex);
    }
  }, [hasNext, currentIndex, onIndexChange]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setIsZoomed(false);
      onIndexChange?.(newIndex);
    }
  }, [hasPrev, currentIndex, onIndexChange]);

  // NOTE: Keyboard navigation (Escape, arrows) and body scroll lock 
  // are now handled by ImmersiveLayout

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

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

  // Custom close button with safe area positioning
  const closeButtonElement = (
    <button
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="absolute right-4 z-50 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
      style={{ top: `calc(${SAFE_AREA.TOP} + 16px)` }}
      aria-label="Close lightbox"
    >
      <X className="w-6 h-6" />
    </button>
  );

  // Caption footer with safe area
  const captionFooter = showCaption && currentImage.caption ? (
    <div className="text-center pb-4">
      <p className="inline-block px-4 py-2 text-sm text-white bg-black/50 rounded-lg max-w-[80vw]">
        {currentImage.caption}
      </p>
    </div>
  ) : undefined;

  return (
    <ImmersiveLayout
      variant="overlay"
      isOpen={true}
      onClose={onClose}
      showCloseButton={false}
      backgroundColor="bg-black/95"
      footer={captionFooter}
    >
      <AnimatePresence mode="wait">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Custom close button */}
          {closeButtonElement}

          {/* Counter - with safe area */}
          {showCounter && images.length > 1 && (
            <div 
              className="absolute left-4 z-50 px-3 py-1.5 text-sm text-white/80 bg-black/50 rounded-full"
              style={{ top: `calc(${SAFE_AREA.TOP} + 16px)` }}
            >
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom button - with safe area */}
          {enableZoom && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
              className="absolute right-16 z-50 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              style={{ top: `calc(${SAFE_AREA.TOP} + 16px)` }}
              aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
          )}

          {/* Previous button */}
          {hasPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Next button */}          
          {hasNext && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Image container */}
          <motion.div
            key={currentImage.id}
            className={cn(
              'relative max-w-[90vw] max-h-[85vh] overflow-hidden',
              isZoomed && 'overflow-auto cursor-zoom-out'
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage.src}
              alt={currentImage.alt || 'Gallery image'}
              className={cn(
                'object-contain transition-transform duration-200',
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in',
                !isZoomed && 'max-w-[90vw] max-h-[85vh]'
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (enableZoom) setIsZoomed(!isZoomed);
              }}
              draggable={false}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </ImmersiveLayout>
  );
};

export default Lightbox;
