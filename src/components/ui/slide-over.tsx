import React, { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockBodyScroll?: boolean;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  children,
  zIndex = 1000,
  className = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockBodyScroll = true
}) => {
  const isMobile = useIsMobile();

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen || !lockBodyScroll) return;
    
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, lockBodyScroll]);

  // Cleanup on unmount
  const handleExitComplete = useCallback(() => {
    document.body.style.overflow = '';
    
    // Release focus traps
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className={`
            fixed flex
            ${isMobile 
              ? 'top-0 left-0 right-0 bottom-16' 
              : 'inset-0'
            }
          `}
          style={{ zIndex }}
        >
          {/* Backdrop */}
          <button
            aria-label="Close modal"
            onClick={handleBackdropClick}
            className={`
              fixed bg-black/50 cursor-default
              ${isMobile 
                ? 'top-0 left-0 right-0 bottom-16' 
                : 'inset-0'
              }
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
          
          {/* Modal Panel */}
          <div 
            className={`
              fixed right-0 bg-background shadow-2xl z-10
              ${isMobile 
                ? 'w-full top-0 bottom-16' 
                : 'inset-y-0 w-[90vw] max-w-[860px] rounded-l-2xl'
              }
              ${className}
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlideOver;