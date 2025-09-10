import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  zIndex?: string;
  ariaLabel?: string;
  portalTarget?: HTMLElement | null;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  open,
  onClose,
  children,
  width = "w-full md:w-[90vw] max-w-[860px]",
  zIndex = "z-[1000]",
  ariaLabel = "slide over panel",
  portalTarget = document.body
}) => {
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Focus management
  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
    } else {
      lastFocusedRef.current?.focus?.();
    }
  }, [open]);

  const handleExitComplete = useCallback(() => {
    document.body.style.overflow = '';
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {open && (
        <motion.div
          key="slide-over"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
          className={`
            fixed flex ${zIndex}
            ${isMobile 
              ? 'top-0 left-0 right-0 bottom-0' 
              : 'inset-0'
            }
          `}
        >
          {/* Backdrop */}
          <button
            aria-label="Close panel"
            onClick={onClose}
            className={`
              fixed bg-black/50 cursor-default
              ${isMobile 
                ? 'top-0 left-0 right-0 bottom-0' 
                : 'inset-0'
              }
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          />
          
          {/* Panel */}
          <div 
            className={`
              fixed right-0 bg-background shadow-2xl z-10
              ${isMobile 
                ? 'w-full top-0 bottom-0' 
                : `inset-y-0 ${width} rounded-l-2xl`
              }
            `}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalTarget
  );
};