import React, { useEffect, useRef } from 'react';

import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';

/**
 * THE SHELF (BRIEF_EXPLORE_MAGAZINE §5).
 *
 * A heading, a sentence-case see-all in the meta slot, one horizontal rail that
 * bleeds right. The sentence-case see-all is the horizontal-rail convention and
 * is deliberately NOT the uppercase foot see-all vertical lists wear.
 *
 * ONE FIXED TILE SIZE PER SHELF. Variable heights inside a rail are never
 * allowed, so the geometry is a prop of the shelf and not of each tile.
 *
 * An empty shelf renders NOTHING — no heading over nothing. The caller decides
 * emptiness (it owns the hook) and simply does not mount this.
 */

export function ExploreShelf({
  heading,
  seeAllLabel,
  onSeeAll,
  onSeen,
  children,
}: {
  heading: string;
  seeAllLabel?: string | null;
  onSeeAll?: () => void;
  /** Fired once, at 50% visibility (amateur_shelf_seen). */
  onSeen?: () => void;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !onSeen || firedRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5 && !firedRef.current) {
            firedRef.current = true;
            onSeen();
            observer.disconnect();
          }
        }
      },
      { threshold: [0.5] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onSeen]);

  return (
    <div ref={hostRef} style={{ fontFamily: SANS }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          /* §5 heading inset 16px; the rail beneath bleeds right. */
          padding: '0 16px',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK, minWidth: 0 }}>
          {heading}
        </span>
        {seeAllLabel && onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            style={{
              marginLeft: 'auto',
              flexShrink: 0,
              border: 0,
              background: 'transparent',
              padding: 0,
              color: A.MUTE,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {seeAllLabel}
          </button>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0 16px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ExploreShelf;
