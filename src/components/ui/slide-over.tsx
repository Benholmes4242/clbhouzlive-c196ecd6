import React, { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  zIndex?: number;
  heightClass?: string;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  lockBodyScroll?: boolean;
  ariaLabel?: string;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  children,
  width = "w-full md:w-[560px] lg:w-[640px]",
  zIndex = 1000,
  heightClass = "max-h-[78vh] h-auto mt-6 mb-6 rounded-2xl",
  className = '',
  closeOnBackdrop = true,
  closeOnEscape = true,
  lockBodyScroll = true,
  ariaLabel = "panel"
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

  return createPortal(
    <div 
      className={`fixed inset-0 ${isOpen ? "" : "pointer-events-none"}`} 
      style={{ zIndex }}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={handleBackdropClick}
      />

      {/* Right-aligned container */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-start justify-end px-4 md:px-6">
        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className={[
            "relative bg-background shadow-2xl border-l md:border rounded-none md:rounded-2xl",
            "transition-transform duration-300 ease-out",
            width,
            heightClass,
            isOpen ? "translate-x-0" : "translate-x-full",
            className
          ].join(" ")}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Make the inside scroll if content is tall */}
          <div className="max-h-[inherit] overflow-auto">
            {children}
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
};

export default SlideOver;