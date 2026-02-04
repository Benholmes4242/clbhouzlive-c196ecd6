/**
 * AvatarLightbox - Fullscreen avatar/profile photo viewer
 * 
 * Uses ImmersiveLayout for safe area handling
 * 
 * Features:
 * - Squircle shape to match app design system
 * - Framer-motion animations
 * - Tap outside / X button / Escape key to dismiss
 * - Swipe down to dismiss on mobile
 * - Body scroll lock when open
 * - Fallback for missing images
 */

import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImmersiveLayout } from '@/components/layout/ImmersiveLayout';
import { SAFE_AREA } from '@/constants/safeArea';

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

  // Hint text footer
  const hintFooter = (
    <motion.p
      className="text-center text-white/50 text-sm pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.3 }}
    >
      Tap outside or swipe down to close
    </motion.p>
  );

  // Custom close button with safe area
  const closeButtonElement = (
    <motion.button
      className="absolute right-4 z-50 w-11 h-11 flex items-center justify-center text-white/80 hover:text-white bg-black/30 rounded-full transition-colors"
      style={{ top: `calc(${SAFE_AREA.TOP} + 16px)` }}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.1 }}
      aria-label="Close"
    >
      <X className="w-6 h-6" />
    </motion.button>
  );

  return (
    <ImmersiveLayout
      variant="overlay"
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      backgroundColor="bg-black/90"
      footer={hintFooter}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          >
            {/* Custom close button */}
            {closeButtonElement}

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
          </motion.div>
        )}
      </AnimatePresence>
    </ImmersiveLayout>
  );
};

export default AvatarLightbox;
