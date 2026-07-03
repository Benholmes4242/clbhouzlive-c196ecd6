import { memo, useRef } from 'react';
import { useEdgeFades } from '../shared/useEdgeFades';

interface HRailProps {
  children: React.ReactNode;
  /** Padding-bottom in px (default 16). */
  paddingBottom?: number;
  /**
   * Padding-top in px (default 0). Preserved for callers like LatestVideosRail
   * that want a small top gap.
   */
  paddingTop?: number;
  /** When true, applies scroll-snap to children. Default true. */
  snap?: boolean;
}

const EDGE_FADE_WIDTH = 28;

/**
 * Pro Shop primitive — horizontal scroll rail with consistent padding,
 * gap, and scroll-snap behaviour.
 *
 * Phase 7:
 *   - snap type = `x proximity` (mandatory fights ballistic flicks on long
 *     shelves; proximity keeps the snap feel without trapping mid-decay).
 *   - Right inset (16px) + scroll-padding-inline-end (28px) so every rest
 *     position peeks the next tile.
 *   - Sibling gradient overlays (data-fade-left / data-fade-right) — cheaper
 *     than mask-image on the scrolling layer.
 */
function HRailInner({
  children,
  paddingBottom = 16,
  paddingTop = 0,
  snap = true,
}: HRailProps) {
  const leftInset = 16;
  const rightInset = 16;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEdgeFades(scrollerRef, wrapperRef);

  return (
    <div
      ref={wrapperRef}
      className="hrail-edge-fade"
      style={{ position: 'relative' }}
    >
      <div
        ref={scrollerRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: `${paddingTop}px ${rightInset}px ${paddingBottom}px ${leftInset}px`,
          scrollPaddingLeft: leftInset,
          scrollPaddingInlineEnd: 28,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: snap ? 'x proximity' : 'none',
        }}
      >
        {children}
      </div>

      {/* Sibling gradient overlays — free composite; visibility controlled by wrapper data-attrs (see index.css .hrail-edge-fade rules). */}
      <div
        aria-hidden
        className="hrail-fade hrail-fade-left"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: EDGE_FADE_WIDTH,
          pointerEvents: 'none',
          background:
            'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background) / 0) 100%)',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />
      <div
        aria-hidden
        className="hrail-fade hrail-fade-right"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: EDGE_FADE_WIDTH,
          pointerEvents: 'none',
          background:
            'linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background) / 0) 100%)',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
      />
    </div>
  );
}

export const HRail = memo(HRailInner);
