/**
 * AvatarLightbox - Fullscreen avatar/profile photo viewer
 * 
 * Features:
 * - Squircle shape to match app design system
 * - Framer-motion animations
 * - Tap outside / X button / Escape key to dismiss
 * - Swipe down to dismiss on mobile
 * - Body scroll lock when open
 * - Fallback for missing images
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvatarLightboxProps {
  /** Whether the lightbox is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Image URL to display */
  imageUrl: string;
  /** Alt text for the image */
  altText?: string;
  /** Shape of the avatar */
  shape?: 'circle' | 'squircle';
  /** Fallback initial letter if no image */
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
  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    // Capture original styles before any modifications
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Always restore original styles on cleanup - prevents frozen scroll/touch
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      if (isOpen) {
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen, handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Swipe down to dismiss
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const shapeClass = shape === 'circle' 
    ? 'rounded-full' 
    : 'clbhouz-squircle'; // Use the app's squircle class

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
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
            className="absolute top-4 right-4 z-50 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Avatar container - draggable for swipe dismiss */}
          <motion.div
            className={cn(
              'relative overflow-hidden shadow-2xl',
              'w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96',
              shapeClass
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{ touchAction: 'none' }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={altText}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : fallbackInitial ? (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-slate-600">
                  {fallbackInitial}
                </span>
              </div>
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <span className="text-slate-400 text-sm">No image</span>
              </div>
            )}
          </motion.div>

          {/* Hint text */}
          <motion.p
            className="absolute bottom-6 left-0 right-0 text-center text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            Tap outside or swipe down to close
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render in portal
  return createPortal(content, document.body);
};

export default AvatarLightbox;
