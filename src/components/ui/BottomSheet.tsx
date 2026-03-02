import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  zIndexBase?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabelledBy?: string;
}

export function BottomSheet({
  open,
  onClose,
  zIndexBase = 1400,
  children,
  className = '',
  style,
  ariaLabelledBy,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate in when opened
  useEffect(() => {
    if (open) {
      // Trigger animation on next frame for CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
    }
  }, [open]);

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
      {/* Backdrop with fade animation */}
      <div
        className={cn(
          "fixed inset-0 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        style={{ zIndex: zIndexBase, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet with slide-up animation */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background rounded-t-[20px] transition-transform duration-300 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{ 
          zIndex: zIndexBase + 1,
          maxHeight: '90vh',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          ...style,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        {/* Draggable grabber area - larger and more visible */}
        <div 
          className="w-full pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-1 mx-auto rounded-full bg-muted-foreground/30" />
        </div>
        {children}
      </div>
    </>,
    document.body
  );
}
