import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { pushSheetEntry, releaseSheetEntry } from './sheetHistory';

/**
 * BRIEF_SHEET_BACKGROUND_CANON — THE SHEET SURFACE.
 *
 * One value for every bottom sheet in the app: #15171F, the background the
 * Your-circle leaderboard sits on (CSS `--background`, and the same value as
 * the existing feature tokens `A.CANVAS` and tourhub `SLATE_50`). It is
 * redeclared here rather than imported because a shared ui primitive must not
 * depend on a feature token file; the three names must stay in step.
 *
 * Sheets do NOT paint their own body or chrome. If a sheet needs a raised
 * band, it uses a hairline or a PANEL panel INSIDE the body — never a second
 * full-width fill, which is what produced the seams this brief removed.
 */
import { SHEET_SURFACE } from '@/lib/tokens/surfaces';
export { SHEET_SURFACE };


interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  zIndexBase?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabelledBy?: string;
  /*
   * BRIEF_SHEET_BACK_BEHAVIOUR_02 §1 — `urlOwnsHistoryEntry` IS GONE FROM THE
   * TYPE. It shipped as an opt-out and never acquired a single consumer: every
   * sheet, URL-addressed or not, registers with the stack. An unused escape
   * hatch is a capability that reads as tested and is not, so it is removed
   * rather than left declared. Passing it is now a COMPILE ERROR. If a sheet
   * ever genuinely needs a different history owner, that is a new named prop
   * introduced with its consumer, not a standing option.
   */

  /*
   * BRIEF_SHEET_BACKGROUND_CANON_02 §1 — `variant` AND `surfaceColor` ARE GONE
   * FROM THE TYPE, not merely ignored. A silent no-op reports as a working
   * feature: the next reader passes a background, sees nothing change, and
   * hunts a CSS conflict that does not exist. Passing either is now a COMPILE
   * ERROR. If a sheet ever genuinely needs a different surface, that is a new
   * NAMED variant on this component, not a free-form colour prop.
   */

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
  maxHeight = '85dvh',
  topRadius = 20,
  grabberColor = 'rgba(255,255,255,0.18)',
  grabberRadius = 2,
  grabberPadding = '10px 0 4px',
  urlOwnsHistoryEntry = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);

  /* BRIEF_SHEET_BACK_BEHAVIOUR §2 — automatic registration with the stack.
     Read through a ref so a caller passing a fresh arrow function on every
     render cannot re-push the entry. */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open || urlOwnsHistoryEntry) return;
    const entry = pushSheetEntry(() => closeRef.current());
    return () => releaseSheetEntry(entry);
  }, [open, urlOwnsHistoryEntry]);

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
