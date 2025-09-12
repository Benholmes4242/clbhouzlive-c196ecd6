import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Custom width classes for responsive design
   * @default "w-full sm:w-[90vw] sm:max-w-[860px]" (matches ProfileModalRouter)
   */
  width?: string;
  /**
   * Custom z-index for stacking
   * @default "z-[1000]"
   */
  zIndex?: string;
  /**
   * Custom height classes
   * @default "" (full height)
   */
  heightClass?: string;
  /**
   * Aria label for accessibility
   * @default "panel"
   */
  ariaLabel?: string;
  /**
   * Portal target element ID
   * @default null (renders to document.body)
   */
  portalTarget?: string;
  /**
   * Backdrop style for layered modals
   * @default "blurred"
   */
  backdrop?: "blurred" | "transparent" | "none";
  /**
   * Root z-index for stacking
   * @default 50
   */
  zIndexRoot?: number;
  /**
   * Whether to lock body scroll
   * @default true
   */
  lockScroll?: boolean;
}

/**
 * Reusable slide-over component based on ProfileModalRouter implementation
 * 
 * Technical Details:
 * - Mount strategy: Portal to document.body or custom target
 * - Animation: Framer Motion with translateX(100%) to 0, 0.25s easeInOut
 * - Layout: Right-aligned, responsive width, optional height constraints
 * - Backdrop: black/50 opacity with click-to-close
 * - A11y: role="dialog", aria-modal, ESC key, focus management, body scroll lock
 * - State: Controlled via open/onClose props
 */
export function SlideOver({
  open,
  onClose,
  children,
  width = "w-full sm:w-[90vw] sm:max-w-[860px]",
  zIndex = "z-[1000]",
  heightClass = "",
  ariaLabel = "panel",
  portalTarget,
  backdrop = "blurred",
  zIndexRoot = 50,
  lockScroll = true
}: SlideOverProps) {
  const isMobile = useIsMobile();
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Handle escape key for accessibility
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

  // Body scroll lock when modal is open
  useEffect(() => {
    if (open && lockScroll) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open, lockScroll]);

  // Focus management
  const handleExitComplete = useCallback(() => {
    // Ensure body scroll is unlocked
    document.body.style.overflow = '';
    
    // Release any focus traps
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    
    // Restore focus to previously focused element
    if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  }, []);

  // Store the currently focused element when opening
  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  const slideOverContent = (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {open && (
        <div
          className="fixed inset-0"
          style={{ zIndex: zIndexRoot }}
        >
          {/* Backdrop - blocks all background interaction */}
          {backdrop !== "none" && (
            <button
              aria-label="Close"
              onClick={onClose}
              className={`fixed inset-0 cursor-default ${
                backdrop === "blurred" 
                  ? "bg-white/10 backdrop-blur-xl" 
                  : "bg-transparent"
              }`}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          )}
          
          {/* Mobile Gutter Hit Target - Analytics & Explicit Touch Area */}
          {isMobile && (
            <div
              className="absolute left-0 top-0 bottom-0 z-20"
              style={{ width: 'max(40px, env(safe-area-inset-left))' }}
              aria-hidden="true"
              data-testid="echo-gutter"
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          )}
          
          {/* Modal Panel */}
          <div 
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={`
              relative z-10 h-full ml-auto bg-background
              ${isMobile 
                ? `w-[calc(100vw-max(40px,env(safe-area-inset-left)))] shadow-lg pl-[1px] ${heightClass}` 
                : `sm:w-[90vw] sm:max-w-[860px] inset-y-0 right-0 rounded-l-2xl shadow-2xl ${heightClass}`
              }
            `}
            style={isMobile ? { height: '100dvh' } : undefined}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render to portal target or document.body
  const targetElement = portalTarget ? document.getElementById(portalTarget) : document.body;
  
  if (!targetElement) {
    return null;
  }

  return createPortal(slideOverContent, targetElement);
}