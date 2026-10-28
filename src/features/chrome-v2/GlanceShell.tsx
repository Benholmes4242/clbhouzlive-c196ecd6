/** Shared glance positioning, backdrop and modal lifecycle. Both variants use this shell. */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { hideOthers } from 'aria-hidden';
import { Z } from '@/config/zIndex';
import './index-glance.css';

export interface GlanceShellProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  label: string;
  children: React.ReactNode;
  /**
   * BRIEF_TOUR_ISLAND §2: 'left' aligns the card's left edge to the left
   * island's left edge (the [data-island-left] capsule); default 'right'
   * keeps every existing glance anchored to the right island.
   */
  align?: 'left' | 'right';
  /** Optional card overrides (TourGlance: width 316, padding 14). */
  cardStyle?: React.CSSProperties;
}
export function GlanceShell({ onClose, anchorRef, label, children, align = 'right', cardStyle }: GlanceShellProps) {
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right?: number; left?: number } | null>(null);
  // Position: align the card's edge to the matching island's edge,
  // top = island bottom + 10. Fall back to the anchor's own rect when the
  // cell is mounted outside the island row (AppHeader, NewsChromeBridge).
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const host = (anchor.closest(align === 'left' ? '[data-island-left]' : '[data-island-right]') as HTMLElement | null) ?? anchor;
    const rect = host.getBoundingClientRect();
    setPos(align === 'left'
      ? { top: rect.bottom + 10, left: rect.left }
      : { top: rect.bottom + 10, right: window.innerWidth - rect.right });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on route change (skip the mount render).
  const mountedPathRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== mountedPathRef.current) onClose();
  }, [location.pathname, onClose]);

  // Focus the card on open; return focus to the index cell on close.
  useEffect(() => {
    const card = cardRef.current;
    card?.focus();
    return () => anchorRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal to assistive technology, exactly as ScorecardGlassOverlay.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    return hideOthers(card);
  }, []);

  return createPortal(<>
    <div aria-hidden data-testid="index-glance-backdrop" onClick={onClose} className="index-glance-backdrop" style={{ zIndex: Z.header - 1 }} />
    <div ref={cardRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="index-glance-shell"
      style={{
        top: pos?.top ?? 0,
        ...(align === 'left' ? { left: pos?.left ?? 12 } : { right: pos?.right ?? 12 }),
        visibility: pos ? 'visible' : 'hidden', zIndex: Z.header + 1,
        ...cardStyle,
      }}>
      {children}
    </div>
  </>, document.body);
}
