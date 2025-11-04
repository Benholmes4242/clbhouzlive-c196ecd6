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

// Rubber-band mapping (feel like iOS pull-to-dismiss)
function rubberband(distance: number, constant = 0.55, max = MAX_DRAG) {
  const d = Math.max(0, distance);
  return (max * d) / (d + constant * max);
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
  const handleRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);
  const lastY = React.useRef(0);
  const lastT = React.useRef(0);
  const dragging = React.useRef(false);
  const yRef = React.useRef(0);
  const animFrame = React.useRef<number | null>(null);

  // Scroll lock when open
  React.useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  const snapTo = React.useCallback((y: number) => {
    if (!sheetRef.current) return;

    // Apply target position first, then enable transition in next microtask
    Promise.resolve().then(() => {
      if (!sheetRef.current) return;
      sheetRef.current.style.transition = 'transform 240ms cubic-bezier(.2,.8,.2,1)';
      void sheetRef.current.offsetHeight; // force style flush
      sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
      
      if (handleRef.current) {
        handleRef.current.style.transition = 'transform 180ms ease, opacity 180ms ease';
        const s = y === 0 ? 1 : 1 + Math.min(0.25, y / 480);
        handleRef.current.style.transform = `scaleX(${s})`;
        handleRef.current.style.opacity = String(Math.min(1, 0.85 + (s - 1) * 1.2));
      }
    });

    window.setTimeout(() => {
      if (!sheetRef.current) return;
      sheetRef.current.style.transition = '';
      if (handleRef.current) {
        handleRef.current.style.transition = '';
      }
      yRef.current = y;
    }, 260);
  }, []);

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
      // animate off-screen then close
      snapTo(window.innerHeight * 0.75);
      window.setTimeout(onClose, 220);
    } else {
      snapTo(0); // snap back
    }
  };

  // Backdrop click to close (ignore clicks that start inside the sheet)
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!open) return null;

  const headerH = getComputedStyle(document.documentElement)
    .getPropertyValue('--hub-header-h') || '72px';

  return (
    <>
      {/* Backdrop - simple opacity fade, no blur on animated layer */}
      <div
        aria-hidden
        onClick={onBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 12002,
          opacity: open ? 1 : 0,
          transition: 'opacity 180ms ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Sheet - wrapper for transform, inner surface for blur */}
      <div
        ref={sheetRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: headerH,
          bottom: 0,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          zIndex: 12003,
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || 'Panel'}
          style={{
            height: '100%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.10))',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Handle */}
          <div
            ref={handleRef}
            style={{
              alignSelf: 'center',
              width: 44,
              height: 5,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.35)',
              margin: '10px 0 6px',
              pointerEvents: 'none',
              transform: 'scaleX(1)',
              opacity: 0.85,
            }}
          />
          {/* Scrollable content */}
          <div
            ref={contentRef}
            style={{
              flex: 1,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '12px 14px 18px',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
