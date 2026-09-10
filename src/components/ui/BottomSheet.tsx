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
  /**
   * DEAD, KEPT FOR COMPILE COMPATIBILITY (BRIEF_SHEET_BACKGROUND_CANON).
   * Neither variant selects a surface any more: there is ONE sheet
   * background, `SHEET_SURFACE` below, and this component owns it. The prop
   * is ignored. Do not reintroduce a per-variant surface.
   */
  variant?: 'light' | 'dark';

  /**
   * DEAD, IGNORED (BRIEF_SHEET_BACKGROUND_CANON). Four sheets had drifted to
   * four different fills through this prop, each correct on the day it was
   * written. Passing it now does nothing on purpose: an override that agrees
   * with the canon today is an override that will disagree later.
   */
  surfaceColor?: string;
  /** Optional max-height override (default '85dvh'). Use e.g. '75dvh' for dvh-aware caps. */
  maxHeight?: string;
  /** Optional analytical-sheet corner radius. Defaults to the existing 20px. */
  topRadius?: number;
  /** Optional grabber treatment. Defaults preserve every existing consumer. */
  grabberColor?: string;
  grabberRadius?: number;
  grabberPadding?: string;
}

export function BottomSheet({
  open,
  onClose,
  zIndexBase = 1400,
  children,
  className = '',
  style,
  ariaLabelledBy,
  variant = 'light',
  surfaceColor,
  maxHeight = '85dvh',
  topRadius = 20,
  grabberColor = 'rgba(255,255,255,0.18)',
  grabberRadius = 2,
  grabberPadding = '10px 0 4px',
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
          "fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full",
          className
        )}
        style={{
          zIndex: zIndexBase + 1,
          maxHeight,
          minHeight: 0,
          borderTopLeftRadius: topRadius,
          borderTopRightRadius: topRadius,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          ...style,
          /* BRIEF_SHEET_BACKGROUND_CANON — THE ONE SHEET BACKGROUND.
             The sheet owns the whole rounded surface, grabber strip included,
             so chrome and body cannot show a seam. It is applied AFTER
             `...style` deliberately: a caller's own background cannot win, or
             the canon is advisory. Value = SHEET_SURFACE (#15171F), the
             background the Your-circle leaderboard sits on. */
          background: SHEET_SURFACE,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        {/* Draggable grabber area - larger and more visible */}
        <div
          className="w-full cursor-grab active:cursor-grabbing touch-none"
          style={{ padding: grabberPadding }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: grabberRadius,
              /* Unconditional white grabber. Both variants paint a dark surface
                 now (see the variant note above), so there is no light case. */
              background: grabberColor,

              margin: '0 auto',
            }}
          />
        </div>
        {children}
      </div>
    </>,
    document.body
  );
}
