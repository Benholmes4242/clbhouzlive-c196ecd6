import * as React from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
};

const THRESHOLD_PX = 92;          // distance to close
const VELOCITY_CLOSE = 0.55;      // px/ms
const MAX_DRAG = 480;             // clamp

// Feature flags for safe rollback
const USE_SHEET_SAFE_UNMOUNT = true;
const USE_IOS_GLASS_SHIM = true;

// Rubber-band mapping (feel like iOS pull-to-dismiss)
function rubberband(distance: number, constant = 0.55, max = MAX_DRAG) {
  const d = Math.max(0, distance);
  return (max * d) / (d + constant * max);
}

// Event-based unmount helper - waits for CSS transitions to complete
function waitTransitionEnd(el: HTMLElement, prop?: string) {
  return new Promise<void>(resolve => {
    const done = () => { el.removeEventListener('transitionend', onEnd, true); resolve(); };
    const onEnd = (e: TransitionEvent) => {
      if (!prop || e.propertyName === prop) done();
    };
    // Fallback in case no transition fires
    const t = window.setTimeout(done, 600);
    el.addEventListener('transitionend', (e) => {
      if (!prop || e.propertyName === prop) { clearTimeout(t); done(); }
    }, true);
  });
}

// Best-effort light haptic
function hapticTapLight() {
  // Capacitor (if app)
  // @ts-ignore
  if (window?.TapticEngine?.impact) {
    // @ts-ignore
    window.TapticEngine.impact({ style: 'light' });
    return;
  }
  // @ts-ignore – Capacitor Haptics plugin
  if (window?.Capacitor?.Plugins?.Haptics?.impact) {
    // @ts-ignore
    window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    return;
  }
  // Android / some browsers
  if (navigator.vibrate) navigator.vibrate(10);
}

export function BottomSheet({ open, onClose, children, ariaLabel }: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);
  const lastY = React.useRef(0);
  const lastT = React.useRef(0);
  const dragging = React.useRef(false);
  const yRef = React.useRef(0);
  const animFrame = React.useRef<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [closing, setClosing] = React.useState(false);

  // Mount/unmount control
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    }
  }, [open]);

  // Frame-safe body scroll lock cleanup
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { requestAnimationFrame(() => { document.body.style.overflow = prev; }); };
  }, [open]);

  // Helpers - RAF-based for smooth animation
  const applyY = React.useCallback((nextY: number) => {
    yRef.current = nextY;
    if (animFrame.current != null) return;
    animFrame.current = requestAnimationFrame(() => {
      animFrame.current = null;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translate3d(0, ${yRef.current}px, 0)`;
      }
      if (handleRef.current) {
        const s = 1 + Math.min(0.25, yRef.current / 480);
        handleRef.current.style.transform = `scaleX(${s})`;
        handleRef.current.style.opacity = String(Math.min(1, 0.85 + (s - 1) * 1.2));
      }
    });
  }, []);

  const snapTo = React.useCallback((y: number, isClosing = false) => {
    if (!sheetRef.current) return;

    // Use faster, smoother easing for close
    const duration = isClosing ? 280 : 240;
    const easing = isClosing ? 'cubic-bezier(.2, .9, .1, 1)' : 'cubic-bezier(.2,.8,.2,1)';

    // Apply target position first, then enable transition in next microtask
    Promise.resolve().then(() => {
      if (!sheetRef.current) return;
      sheetRef.current.style.transition = `transform ${duration}ms ${easing}`;
      void sheetRef.current.offsetHeight; // force style flush
      sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
      
      if (handleRef.current) {
        handleRef.current.style.transition = `transform ${duration - 60}ms ease, opacity ${duration - 60}ms ease`;
        const s = y === 0 ? 1 : 1 + Math.min(0.25, y / 480);
        handleRef.current.style.transform = `scaleX(${s})`;
        handleRef.current.style.opacity = String(Math.min(1, 0.85 + (s - 1) * 1.2));
      }
    });

    if (!USE_SHEET_SAFE_UNMOUNT) {
      // Old path: timer-based cleanup
      window.setTimeout(() => {
        if (!sheetRef.current) return;
        sheetRef.current.style.transition = '';
        if (handleRef.current) {
          handleRef.current.style.transition = '';
        }
        yRef.current = y;
      }, duration + 20);
    }
  }, []);

  // Event-based close with proper unmount order
  const closeSheet = React.useCallback(async () => {
    if (!USE_SHEET_SAFE_UNMOUNT || !sheetRef.current) {
      onClose?.();
      return;
    }

    setClosing(true);
    
    // Trigger closing animations
    const exitDistance = Math.max(window.innerHeight, 800);
    snapTo(exitDistance, true);

    // Wait for both panel and backdrop to finish animating
    await Promise.all([
      waitTransitionEnd(sheetRef.current, 'transform'),
      backdropRef.current ? waitTransitionEnd(backdropRef.current, 'opacity') : Promise.resolve()
    ]);

    // Fully unmount overlay & panel before calling onClose
    setMounted(false);
    onClose?.();
  }, [onClose, snapTo]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        if (USE_SHEET_SAFE_UNMOUNT) {
          closeSheet();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, closeSheet]);

  // Drag start (only if content is scrolled to top)
  const canStartDrag = () => {
    const el = contentRef.current;
    return !el || el.scrollTop <= 0;
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    if (!open) return;
    if (e.button !== 0) return;
    if (!canStartDrag()) return;
    
    dragging.current = true;
    startY.current = e.clientY;
    lastY.current = e.clientY;
    lastT.current = e.timeStamp;
    
    // Disable transitions immediately
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
    if (handleRef.current) handleRef.current.style.transition = 'none';
    
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!dragging.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    e.preventDefault();
    lastY.current = e.clientY;
    lastT.current = e.timeStamp;
    const rb = rubberband(dy);
    applyY(rb);
  };

  const onPointerUp: React.PointerEventHandler = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dy = lastY.current - startY.current;
    const dt = Math.max(1, e.timeStamp - lastT.current);
    const vy = (e.clientY - lastY.current) / dt; // px/ms (last segment)
    const shouldClose = dy > THRESHOLD_PX || vy > VELOCITY_CLOSE;
    if (shouldClose) {
      hapticTapLight(); // subtle tap when it commits to close
      if (USE_SHEET_SAFE_UNMOUNT) {
        closeSheet();
      } else {
        // Old path
        const exitDistance = Math.max(window.innerHeight, 800);
        snapTo(exitDistance, true);
        window.setTimeout(onClose, 300);
      }
    } else {
      snapTo(0, false); // snap back
    }
  };

  // Backdrop click to close (ignore clicks that start inside the sheet)
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      if (USE_SHEET_SAFE_UNMOUNT) {
        closeSheet();
      } else {
        onClose();
      }
    }
  };

  if (!mounted && !open) return null;

  const headerH = getComputedStyle(document.documentElement)
    .getPropertyValue('--hub-header-h') || '72px';

  return (
    <>
      {/* Backdrop - starts below header, doesn't cover it */}
      <div
        ref={backdropRef}
        aria-hidden
        onClick={onBackdropClick}
        className={closing ? 'sheetBackdrop closing' : 'sheetBackdrop'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: headerH,
          height: `calc(100dvh - ${headerH})`,
          background: 'transparent',
          zIndex: 12002,
          opacity: closing ? 0 : 1,
          transition: 'opacity 220ms ease',
          pointerEvents: open && !closing ? 'auto' : 'none',
        }}
      />

      {/* Clipper - owns the rounded radius and clips everything inside */}
      <div
        ref={sheetRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || 'Panel'}
        className={closing ? 'bottomSheet closing' : 'bottomSheet'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: headerH,
          bottom: 0,
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          transform: closing ? `translate3d(0, ${Math.max(window.innerHeight, 800)}px, 0)` : 'translate3d(0, 0, 0)',
          transition: closing ? 'transform 280ms cubic-bezier(.2, .9, .1, 1)' : '',
          willChange: 'transform',
          zIndex: 12003,
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          overflow: 'hidden',
          clipPath: 'inset(0 round 24px)',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          background: 'transparent',
        }}
      >
        {/* Surface - holds all visual effects (blur, background, shadow) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'saturate(120%) blur(24px)',
            WebkitBackdropFilter: 'saturate(120%) blur(24px)',
            background: '#000000',
            boxShadow: '0 -20px 50px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Scrollable content */}
          <div
            ref={contentRef}
            style={{
              flex: 1,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '0',
              overscrollBehavior: 'contain',
              background: 'transparent',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
