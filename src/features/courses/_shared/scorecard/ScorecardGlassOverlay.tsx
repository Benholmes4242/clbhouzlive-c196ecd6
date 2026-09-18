import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { pushSheetEntry, releaseSheetEntry } from '@/components/ui/sheetHistory';
import { Z } from '@/config/zIndex';

const AXIS_LOCK_PX = 8;
const AXIS_RATIO = 1.2;
const CLOSE_DISTANCE_PX = 100;
const CLOSE_VELOCITY = 0.6;
const OPEN_HOLD_MS = 150;
const ENTER_OPACITY_MS = 180;
const ENTER_TRANSFORM_MS = 240;
const EXIT_MS = 140;

interface ScorecardGlassOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Hole data is ready. A cold overlay waits at most 150ms before showing. */
  contentReady?: boolean;
  onHorizontalDrag?: {
    onStart: () => void;
    onMove: (dx: number) => void;
    onEnd: (dx: number, velocity: number) => void;
  } | null;
  presentation?: 'overlay' | 'page';
  children: React.ReactNode;
}

/** Scorecard-only floating presentation. Shared BottomSheet remains unchanged. */
export function ScorecardGlassOverlay({
  open,
  onClose,
  contentReady = true,
  onHorizontalDrag = null,
  presentation = 'overlay',
  children,
}: ScorecardGlassOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const horizontalRef = useRef(onHorizontalDrag);
  const suppressClickRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const clickResetTimerRef = useRef<number | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    startedAt: number;
    lastAt: number;
    axis: 'none' | 'horizontal' | 'vertical' | 'scroll';
  } | null>(null);
  closeRef.current = onClose;
  horizontalRef.current = onHorizontalDrag;

  useEffect(() => {
    if (presentation === 'page') return;
    if (!open) {
      setEntered(false);
      setDragY(0);
      setAnimating(true);
      if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = window.setTimeout(() => {
        setMounted(false);
        setLockedHeight(null);
        setAnimating(false);
      }, EXIT_MS);
      return () => {
        if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
      };
    }
    if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current);
    if (contentReady) {
      setMounted(true);
      return;
    }
    const hold = window.setTimeout(() => setMounted(true), OPEN_HOLD_MS);
    return () => window.clearTimeout(hold);
  }, [open, contentReady, presentation]);

  useLayoutEffect(() => {
    if (!mounted || !open || presentation === 'page') return;
    const card = cardRef.current;
    if (!card) return;
    // offsetHeight is the pre-transform layout height. Measuring the entry's
    // 0.96-scaled bounding box would lock a cold skeleton about 4% too short.
    const measuredHeight = card.offsetHeight;
    if (measuredHeight > 0) setLockedHeight(measuredHeight);
    setAnimating(true);
    const frame = requestAnimationFrame(() => setEntered(true));
    if (animationTimerRef.current != null) window.clearTimeout(animationTimerRef.current);
    animationTimerRef.current = window.setTimeout(() => setAnimating(false), ENTER_TRANSFORM_MS);
    return () => {
      cancelAnimationFrame(frame);
      if (animationTimerRef.current != null) window.clearTimeout(animationTimerRef.current);
    };
  }, [mounted, open, presentation]);

  useEffect(() => {
    if (!mounted || presentation === 'page') return;
    const entry = pushSheetEntry(() => closeRef.current());
    const root = document.getElementById('root');
    const previousRootOverflow = root?.style.overflow ?? '';
    const previousBodyOverflow = document.body.style.overflow;
    if (root) root.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      releaseSheetEntry(entry);
      if (root) root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [mounted, presentation]);

  useEffect(() => {
    if (!mounted || presentation === 'page') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mounted, presentation]);

  const scrollableBodyAtTop = useCallback((target: EventTarget | null) => {
    let node = target as HTMLElement | null;
    while (node && node !== cardRef.current) {
      if (node.hasAttribute('data-scorecard-scroll')) return node.scrollTop <= 0;
      node = node.parentElement;
    }
    return true;
  }, []);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    gesture.current = {
      x: touch.clientX,
      y: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startedAt: Date.now(),
      lastAt: Date.now(),
      axis: 'none',
    };
  }, []);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    const current = gesture.current;
    if (!current) return;
    const touch = event.touches[0];
    const dx = touch.clientX - current.x;
    const dy = touch.clientY - current.y;
    if (current.axis === 'none') {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      if (horizontalRef.current && Math.abs(dx) > Math.abs(dy) * AXIS_RATIO) {
        current.axis = 'horizontal';
        horizontalRef.current.onStart();
      } else if (dy > 0 && scrollableBodyAtTop(event.target)) {
        current.axis = 'vertical';
      } else {
        current.axis = 'scroll';
      }
    }
    current.lastX = touch.clientX;
    current.lastY = touch.clientY;
    current.lastAt = Date.now();
    if (current.axis === 'horizontal') {
      horizontalRef.current?.onMove(dx);
    } else if (current.axis === 'vertical') {
      event.preventDefault();
      setDragY(Math.max(0, dy));
    }
  }, [scrollableBodyAtTop]);

  const onTouchEnd = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (!current) return;
    if (current.axis === 'horizontal') {
      suppressClickRef.current = true;
      if (clickResetTimerRef.current != null) window.clearTimeout(clickResetTimerRef.current);
      clickResetTimerRef.current = window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      const dx = current.lastX - current.x;
      const elapsed = Math.max(1, current.lastAt - current.startedAt);
      horizontalRef.current?.onEnd(dx, dx / elapsed);
      return;
    }
    if (current.axis !== 'vertical') return;
    suppressClickRef.current = true;
    if (clickResetTimerRef.current != null) window.clearTimeout(clickResetTimerRef.current);
    clickResetTimerRef.current = window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    const dy = current.lastY - current.y;
    const elapsed = Math.max(1, current.lastAt - current.startedAt);
    if (dy > CLOSE_DISTANCE_PX || dy / elapsed > CLOSE_VELOCITY) {
      closeRef.current();
      return;
    }
    setDragY(0);
  }, []);

  const onTouchCancel = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    if (current?.axis === 'horizontal') horizontalRef.current?.onEnd(0, 0);
    setDragY(0);
  }, []);

  useEffect(() => () => {
    if (clickResetTimerRef.current != null) window.clearTimeout(clickResetTimerRef.current);
  }, []);

  const onCardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    closeRef.current();
  }, []);

  if (presentation === 'page') {
    if (!open) return null;
    return (
      <div
        data-scorecard-page="true"
        style={{
          position: 'relative',
          width: '100%',
          height: '100dvh',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--page-canvas, #0d0d0d)',
        }}
      >
        {children}
      </div>
    );
  }

  if (!mounted) return null;

  return createPortal(
    <div
      data-scorecard-overlay="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.sheetBackdrop,
        background: 'rgba(6,8,11,0.5)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        opacity: entered ? 1 : 0,
        transition: `opacity ${open ? ENTER_OPACITY_MS : EXIT_MS}ms ${open ? 'ease-out' : 'ease-in'}`,
      }}
      onClick={() => closeRef.current()}
    >
      <div
        ref={cardRef}
        data-scorecard-glass-card="true"
        role="dialog"
        aria-modal="true"
        onClick={onCardClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        style={{
          position: 'absolute',
          top: '50%',
          left: 14,
          right: 14,
          maxHeight: '82dvh',
          height: lockedHeight == null ? undefined : lockedHeight,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(24,27,35,0.74)',
          backdropFilter: 'blur(30px) saturate(160%)',
          WebkitBackdropFilter: 'blur(30px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 24,
          boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
          opacity: entered ? 1 : 0,
          transform: `translateY(calc(-50% + ${dragY}px)) scale(${entered ? 1 : open ? 0.96 : 0.97})`,
          transition: dragY > 0
            ? 'none'
            : open
              ? `opacity ${ENTER_OPACITY_MS}ms ease-out, transform ${ENTER_TRANSFORM_MS}ms cubic-bezier(.32,.72,0,1)`
              : `opacity ${EXIT_MS}ms ease-in, transform ${EXIT_MS}ms ease-in`,
          willChange: animating ? 'transform, opacity' : 'auto',
          zIndex: Z.sheet,
        }}
      >
        <style>{`@media (prefers-reduced-motion: reduce) { [data-scorecard-glass-card="true"] { transform: translateY(calc(-50% + ${dragY}px)) !important; transition: opacity ${open ? ENTER_OPACITY_MS : EXIT_MS}ms ${open ? 'ease-out' : 'ease-in'} !important; } }`}</style>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default ScorecardGlassOverlay;