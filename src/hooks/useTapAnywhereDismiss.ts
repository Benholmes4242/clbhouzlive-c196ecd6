/**
 * useTapAnywhereDismiss — BRIEF 20 E2. The one "tap anywhere on the card
 * closes it" rule shared by the scorecard glass card and the review card.
 * A click on the card closes it unless a gesture just ended (drag, swipe or
 * scroll call suppressNextClick, or a pointer moved past the slop) or, with
 * skipInteractive, the click came from an interactive descendant (button,
 * link, form control, role=button/link or [data-card-interactive]), which
 * keeps its own action.
 */
import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [role="link"], [role="slider"], [data-card-interactive]';
const SLOP_PX = 8;

export function isInteractiveTarget(target: EventTarget | null, card: Element): boolean {
  const el = target instanceof Element ? target.closest(INTERACTIVE) : null;
  return !!el && el !== card && card.contains(el);
}

export function useTapAnywhereDismiss(onClose: () => void, options: { skipInteractive?: boolean } = {}) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const suppressRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const skipInteractive = !!options.skipInteractive;

  const suppressNextClick = useCallback(() => {
    suppressRef.current = true;
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { suppressRef.current = false; }, 0);
  }, []);

  useEffect(() => () => { if (timerRef.current != null) window.clearTimeout(timerRef.current); }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => { downRef.current = { x: e.clientX, y: e.clientY }; }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = downRef.current;
    if (d && (Math.abs(e.clientX - d.x) > SLOP_PX || Math.abs(e.clientY - d.y) > SLOP_PX)) { downRef.current = null; suppressNextClick(); }
  }, [suppressNextClick]);

  const onCardClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (suppressRef.current) { suppressRef.current = false; return; }
    if (skipInteractive && isInteractiveTarget(event.target, event.currentTarget)) return;
    closeRef.current();
  }, [skipInteractive]);

  return { onCardClick, suppressNextClick, onPointerDown, onPointerMove };
}
