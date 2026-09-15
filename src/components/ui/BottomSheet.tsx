import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { midExtent } from './sheetMid';
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
  /**
   * BRIEF_ROUND_SHEET_CUES §1 — REMEASURE MID WHEN THE CONTENT CHANGES.
   * Paging swaps one round for another and the card's height goes with it (a
   * partial round is shorter, a two-line course name taller), so mid has to be
   * measured again. Any value that changes with the content will do; absent
   * keeps the single measurement at open.
   */
  midKey?: string | number;
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
  midKey,
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
  /** §1 — true only when mid actually hides something below the card. */
  const [peeking, setPeeking] = useState(false);
  const fullH = useRef(0);
  const midOffset = useRef(0);
  const gesture = useRef<{
    y: number; x: number; axis: 'none' | 'v' | 'h'; base: number; t: number; lastY: number; lastX: number; lastT: number;
  } | null>(null);
  const reduceMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * mid = summary + whole card + THE PEEK, capped at 62dvh. Measured, never
   * assumed.
   *
   * BRIEF_ROUND_SHEET_CUES §1 — THE NEXT SECTION PEEKS. Mid used to end exactly
   * under the card, so the sheet read as finished and nothing said it opened
   * further. The consumer declares how much of the next section must show past
   * the marker on `data-sheet-mid-peek` (44 on the round sheet); with nothing
   * below the card it declares 0 and mid stays at the card's bottom edge, as
   * before. The 62dvh cap is unchanged and still wins.
   */
  const measure = useCallback(() => {
    const el = sheetRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    if (!h) return;
    fullH.current = h;
    const marker = el.querySelector('[data-sheet-mid-extent]') as HTMLElement | null;
    const declared = Number(marker?.getAttribute('data-sheet-mid-peek') ?? 0);
    const peek = Number.isFinite(declared) && declared > 0 ? declared : 0;
    const { offset: midOff, peeking: p } = midExtent({
      sheetHeight: h,
      viewportHeight: window.innerHeight,
      markerExtent: marker
        ? marker.getBoundingClientRect().bottom - el.getBoundingClientRect().top
        : null,
      peek,
    });
    midOffset.current = midOff;
    /* The fade is a cue over a cut. With nothing hidden below there is no cut,
       so a fade would be a gradient over the end of the sheet. */
    setPeeking(p);
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

  /* §1 — A NEW ROUND IS A NEW MEASUREMENT. Mid is re-derived when the content
     key changes, and the sheet is moved to it only while it is resting at mid:
     a member who has pulled the sheet to full keeps full. */
  useEffect(() => {
    if (!open || !detented || midKey == null) return;
    const run = () => {
      measure();
      if (detent === 'mid' && !dragging) moveOffset(midOffset.current);
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(run));
    const timer = window.setTimeout(run, 200);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midKey]);

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

  /*
   * BRIEF_ROUND_SHEET_CUES §5 — THE LOCK IS NOT THE BLOCKER, BUT IT IS STILL A
   * BLOCKER. `body { overflow: hidden }` was set here for every sheet. On this
   * app body is NOT the page scroller (#root is; see the report), so the lock
   * never stopped the page by hand — and it never stopped a programmatic scroll
   * either. It is kept EXACTLY AS BEFORE for every non-detented sheet, because
   * that is a great many consumers and the brief changes only the detented case.
   *
   * DETENTED sheets do not lock. The host scrolls the feed under them to keep
   * the tapped card visible, and a lock on the resolved scroller would fight it.
   * Hand-scrolling the page behind is stopped at the backdrop instead (below),
   * which is where the finger actually is.
   */
  useEffect(() => {
    if (!open || detented) return;
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prev;
    };
  }, [open, detented]);

  /* §5 — THE BACKDROP EATS THE FINGER, NOT THE PAGE. passive:false so the move
     can be prevented; only for detented sheets, and only on the backdrop, so a
     programmatic scroll of the real scroller still runs. */
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !detented) return;
    const el = backdropRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', stop, { passive: false });
    return () => el.removeEventListener('touchmove', stop);
  }, [open, detented]);

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
  /* §1 — the fade belongs to MID ONLY, and goes the instant the sheet is pulled
     up toward full rather than waiting for the detent to settle. */
  const fadeOn = detented && peeking && detent === 'mid' && isAnimating
    && offset > 2 && !(dragging && offset < midOffset.current - 4);

  return createPortal(
    <>
      {/* Backdrop with fade animation */}
      <div
        ref={backdropRef}
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
        {/*
          BRIEF_ROUND_SHEET_CUES §1 — THE FADE OVER THE CUT.
          56px, transparent to the sheet surface, pinned to the VISIBLE bottom
          edge. The sheet is laid out at full height and pushed down by `offset`,
          so the edge the member sees is `offset` px up from the sheet's own
          bottom — which is why the fade is placed there and not at bottom: 0.
          It exists only while mid is hiding something (`peeking`), and it leaves
          the moment the sheet is being pulled toward full: at full there is no
          cut to soften.
        */}
        {fadeOn && (
          <div
            aria-hidden="true"
            data-sheet-mid-fade="true"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: offset, height: 56,
              pointerEvents: 'none',
              background: `linear-gradient(to bottom, rgba(21,23,31,0) 0%, ${SHEET_SURFACE} 100%)`,
            }}
          />
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
