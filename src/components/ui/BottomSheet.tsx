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
  /*
   * BRIEF_SHEET_SCROLL §1 — OPT-IN SCROLLING BODY.
   *
   * The root is `fixed bottom-0` with a `maxHeight` and NO overflow rule and
   * NO flex column. A consumer that hands over a long list in one plain block
   * therefore renders a list taller than the capped sheet with no scroll
   * container anywhere — the member sees the first rows and can reach no
   * further. Every sheet that scrolls correctly today does so because IT
   * declared its own inner `maxHeight: calc(85dvh - 30px)` + `overflowY:auto`
   * band; nothing in this primitive provides one.
   *
   * `scrollBody` makes the root a flex column that clips, and wraps children
   * in the single scrolling region (`flex:1; minHeight:0; overflowY:auto`,
   * momentum + contained overscroll). DEFAULT FALSE, so all existing consumers
   * render byte-identically and keep owning their own scroller.
   *
   * The drag-to-dismiss gesture is NOT affected: its handlers live only on the
   * grabber strip, which stays OUTSIDE the scrolling region, so finger scroll
   * in the list and drag on the handle can never contend.
   */
  scrollBody?: boolean;
  /*
   * BRIEF_ROUND_SHEET §1.1 — DETENTS ARE OPT-IN.
   *
   * ABSENT (every existing consumer): behaviour is byte-identical to before —
   * drag lives on the grabber only, down only, no detents, close past 100px.
   *
   * PRESENT (['mid','full']): the sheet opens at MID. Mid is measured at
   * runtime from the element the consumer marks `data-sheet-mid-extent` (the
   * last thing that must be visible at mid — the summary plus the whole card)
   * and capped at 62dvh. With no marker the cap IS the height. Full is the
   * existing maxHeight.
   *
   * The sheet is always laid out at its FULL height and translated down by the
   * difference at mid, so a drag follows the finger with no relayout and the
   * card cannot reflow between detents. At mid the body must not scroll: a
   * scoped style rule freezes any `data-sheet-scroll` region, so a vertical
   * drag anywhere on the sheet moves the sheet and has no scroll to fight.
   */
  detents?: ['mid', 'full'];
  /** Reported on every settled detent change (analytics + host state). */
  onDetentChange?: (detent: 'mid' | 'full') => void;
  /** Horizontal gesture hand-off (paging). Return true to claim the pointer. */
  onHorizontalDrag?: {
    onStart: () => void;
    onMove: (dx: number) => void;
    onEnd: (dx: number, velocity: number) => void;
  } | null;
}

/** Detent spring. Reduced motion collapses it to an instant change. */
const DETENT_MS = 380;
const DETENT_EASE = 'cubic-bezier(.2,.8,.2,1)';
const MID_CAP_DVH = 0.62;
/** Axis lock: 8px of travel, horizontal only when clearly horizontal. */
const AXIS_LOCK_PX = 8;
const AXIS_RATIO = 1.2;

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
  scrollBody = false,
  detents,
  onDetentChange,
  onHorizontalDrag = null,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);

  /* ------------------------------------------------- detents (opt-in only) */
  const detented = !!detents;
  const [detent, setDetent] = useState<'mid' | 'full'>('mid');
  /** How far the sheet is pushed down from full, in px. 0 === full. */
  const [offset, setOffset] = useState(0);
  /** The live value the gesture reads: state lags a fast finger by a frame. */
  const offsetRef = useRef(0);
  const moveOffset = useCallback((v: number) => { offsetRef.current = v; setOffset(v); }, []);
  const [dragging, setDragging] = useState(false);
  const fullH = useRef(0);
  const midOffset = useRef(0);
  const gesture = useRef<{
    y: number; x: number; axis: 'none' | 'v' | 'h'; base: number; t: number; lastY: number; lastX: number; lastT: number;
  } | null>(null);
  const reduceMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** mid = summary + whole card, capped at 62dvh. Measured, never assumed. */
  const measure = useCallback(() => {
    const el = sheetRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (!h) return;
    fullH.current = h;
    const cap = Math.round(window.innerHeight * MID_CAP_DVH);
    const marker = el.querySelector('[data-sheet-mid-extent]') as HTMLElement | null;
    let wanted = cap;
    if (marker) {
      const need = marker.getBoundingClientRect().bottom - el.getBoundingClientRect().top + 16;
      wanted = Math.min(cap, Math.max(160, Math.round(need)));
    }
    const mid = Math.min(h, wanted);
    midOffset.current = Math.max(0, h - mid);
  }, []);

  useEffect(() => {
    if (!open || !detented) return;
    setDetent('mid');
    const run = () => {
      measure();
      moveOffset(midOffset.current);
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(run));
    const timer = window.setTimeout(run, 220);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(timer); };
  }, [open, detented, measure, moveOffset]);

  const settle = useCallback(
    (next: 'mid' | 'full') => {
      measure();
      moveOffset(next === 'mid' ? midOffset.current : 0);
      setDetent((prev) => {
        if (prev !== next) onDetentChange?.(next);
        return next;
      });
    },
    [measure, moveOffset, onDetentChange],
  );

  const scrollableAncestor = (target: EventTarget | null): boolean => {
    let node = target as HTMLElement | null;
    while (node && node !== sheetRef.current) {
      if (node.hasAttribute?.('data-sheet-scroll')) return true;
      node = node.parentElement;
    }
    return false;
  };

  const onDetentTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    // At FULL the body scrolls, so only the grabber and the fixed summary
    // (data-sheet-drag) may start a drag. At MID nothing scrolls, so anywhere
    // is safe. Horizontal paging is allowed from anywhere at either detent.
    gesture.current = {
      y: t.clientY, x: t.clientX, axis: 'none',
      base: offsetRef.current, t: Date.now(), lastY: t.clientY, lastX: t.clientX, lastT: Date.now(),
    };
  }, []);

  const onDetentTouchMove = useCallback((e: React.TouchEvent) => {
    const g = gesture.current;
    if (!g) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = t.clientY - g.y;
    if (g.axis === 'none') {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      if (onHorizontalDrag && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO) {
        g.axis = 'h';
        onHorizontalDrag.onStart();
      } else {
        const fromScroller = detent === 'full' && scrollableAncestor(e.target);
        if (fromScroller) { gesture.current = null; return; }
        g.axis = 'v';
        setDragging(true);
      }
    }
    if (g.axis === 'h') { g.lastX = t.clientX; g.lastT = Date.now(); onHorizontalDrag?.onMove(dx); return; }
    g.lastY = t.clientY; g.lastT = Date.now();
    moveOffset(Math.max(0, g.base + dy));
  }, [detent, moveOffset, onHorizontalDrag]);

  const onDetentTouchEnd = useCallback(() => {
    const g = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (!g) return;
    if (g.axis === 'h') {
      /* The real travel and speed, so the host can decide page-or-return. */
      const dx = g.lastX - g.x;
      const dt = Math.max(1, g.lastT - g.t);
      onHorizontalDrag?.onEnd(dx, dx / dt);
      return;
    }
    if (g.axis !== 'v') return;
    const dy = offsetRef.current - g.base;
    const dt = Math.max(1, Date.now() - g.t);
    const flick = Math.abs(dy) / dt > 0.6;
    if (detent === 'mid') {
      if (dy < -50 || (flick && dy < 0)) return settle('full');
      if (dy > 90 || (flick && dy > 0)) return onClose();
      return settle('mid');
    }
    if (dy > 160 || (flick && dy > 90)) return onClose();
    if (dy > 70) return settle('mid');
    return settle('full');
  }, [detent, onClose, onHorizontalDrag, settle]);


  /* BRIEF_SHEET_BACK_BEHAVIOUR §2 — automatic registration with the stack, for
     every open sheet without exception (see the removed opt-out above).
     Read through a ref so a caller passing a fresh arrow function on every
     render cannot re-push the entry. */
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const entry = pushSheetEntry(() => closeRef.current());
    return () => releaseSheetEntry(entry);
  }, [open]);


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

  /* The backdrop follows the sheet: at mid it is lighter than at full, and it
     tracks the finger during a drag rather than jumping at release. */
  const revealed = detented && fullH.current > 0
    ? Math.max(0, Math.min(1, 1 - offset / fullH.current))
    : 1;
  const detentTransition = dragging || reduceMotion
    ? 'none'
    : `transform ${DETENT_MS}ms ${DETENT_EASE}`;

  return createPortal(
    <>
      {/* Backdrop with fade animation */}
      <div
        className={cn(
          "fixed inset-0 transition-opacity duration-300",
          !detented && (isAnimating ? "opacity-100" : "opacity-0")
        )}
        style={{
          zIndex: zIndexBase,
          backgroundColor: 'rgba(0,0,0,0.4)',
          ...(detented
            ? { opacity: isAnimating ? 0.35 + 0.65 * revealed : 0, transition: dragging ? 'none' : undefined }
            : null),
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet with slide-up animation */}
      <div
        ref={sheetRef}
        data-sheet-detent={detented ? detent : undefined}
        className={cn(
          "fixed bottom-0 left-0 right-0",
          !detented && "transition-transform duration-300 ease-out",
          !detented && (isAnimating ? "translate-y-0" : "translate-y-full"),
          className
        )}
        onTouchStart={detented ? onDetentTouchStart : undefined}
        onTouchMove={detented ? onDetentTouchMove : undefined}
        onTouchEnd={detented ? onDetentTouchEnd : undefined}
        style={{
          ...(detented
            ? {
                transform: `translateY(${isAnimating ? offset : (fullH.current || 1000)}px)`,
                transition: detentTransition,
              }
            : null),
          zIndex: zIndexBase + 1,
          maxHeight,
          minHeight: 0,
          borderTopLeftRadius: topRadius,
          borderTopRightRadius: topRadius,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          /* BRIEF_SHEET_SCROLL §1 — only under the opt-in. */
          ...(scrollBody
            ? { display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }
            : null),
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
        {/* BRIEF_ROUND_SHEET §1.1 — at MID nothing inside the sheet scrolls, so
            a vertical drag anywhere moves the sheet with nothing to fight. */}
        {detented && (
          <style>{`[data-sheet-detent="mid"] [data-sheet-scroll]{overflow:hidden!important;touch-action:none!important;}`}</style>
        )}
        {/* Draggable grabber area - larger and more visible */}
        <div
          className="w-full cursor-grab active:cursor-grabbing touch-none"
          style={{ padding: grabberPadding }}
          onTouchStart={detented ? undefined : handleTouchStart}
          onTouchMove={detented ? undefined : handleTouchMove}
          onTouchEnd={detented ? undefined : handleTouchEnd}
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
        {scrollBody ? (
          /* BRIEF_SHEET_SCROLL §1 — THE ONE SCROLLING REGION. Outside the
             grabber, so drag-to-dismiss and finger scroll never contend. */
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </>,
    document.body
  );
}
