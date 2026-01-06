import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  zIndexBase?: number;
  children: React.ReactNode;
  className?: string;
  ariaLabelledBy?: string;
}

export function BottomSheet({
  open,
  onClose,
  zIndexBase = 1400,
  children,
  className = '',
  ariaLabelledBy,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [open]);

  // ESC key handling
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Swipe down to close handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    
    const deltaY = e.touches[0].clientY - dragStartY.current;
    // Only allow dragging down
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;
    
    // If dragged more than 100px, close the sheet
    if (currentTranslateY.current > 100) {
      onClose();
    } else {
      // Snap back to original position
      sheetRef.current.style.transform = 'translateY(0)';
    }
    
    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md"
        style={{ zIndex: zIndexBase }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-sq-lg shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transform transition-transform duration-300 ${className}`}
        style={{ 
          zIndex: zIndexBase + 1,
          maxHeight: '90vh',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        {/* Draggable grabber area */}
        <div 
          className="w-full pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 mx-auto rounded-full bg-muted-foreground/30" />
        </div>
        {children}
      </div>
    </>,
    document.body
  );
}
