/**
 * AvatarLightbox - Fullscreen avatar/profile photo viewer with pinch-zoom
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';

export interface AvatarLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  shape?: 'circle' | 'squircle';
  fallbackInitial?: string;
}

export const AvatarLightbox: React.FC<AvatarLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Profile photo',
  shape = 'squircle',
  fallbackInitial,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { ref: zoomRef, imgRef, style: zoomStyle, scale, reset: resetZoom } = usePinchZoomPointer();
  const isZoomed = scale > 1;

  useEffect(() => {
    setImgFailed(false);
    resetZoom();
  }, [imageUrl, resetZoom]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      if (isOpen) window.scrollTo(0, scrollY);
    };
  }, [isOpen, handleEscape]);

  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ lightbox: true }, '');
    const handlePop = () => onClose();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'clbhouz-squircle';
  const showFallback = !imageUrl || imgFailed;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={altText}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/90"
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Close button */}
          <motion.button
            ref={closeBtnRef}
            className="absolute right-4 z-50 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
            style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Avatar container - draggable for swipe dismiss, disabled when zoomed */}
          <motion.div
            className={cn(
              'relative overflow-hidden shadow-2xl',
              'w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96',
              shapeClass
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag={isZoomed ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{ touchAction: isZoomed ? 'none' : 'none' }}
          >
            {showFallback ? (
              fallbackInitial ? (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-slate-600">
                    {fallbackInitial}
                  </span>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image</span>
                </div>
              )
            ) : (
              <div ref={zoomRef} style={zoomStyle} className="w-full h-full">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt={altText}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={() => setImgFailed(true)}
                />
              </div>
            )}
          </motion.div>

          {/* Hint text */}
          <motion.p
            className="absolute left-0 right-0 text-center text-white/50 text-sm"
            style={{ bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isZoomed ? 'Double-tap to reset zoom' : 'Tap outside or swipe down to close'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default AvatarLightbox;
