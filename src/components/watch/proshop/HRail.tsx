import { memo } from 'react';

interface HRailProps {
  children: React.ReactNode;
  /** Padding-bottom in px (default 16). */
  paddingBottom?: number;
  /**
   * Padding-top in px (default 0).
   * Added in Phase 2 so callers like LatestVideosRail can preserve a small
   * top-gap above the rail without re-implementing the scroll container.
   * Defaults to 0 to keep all existing Clips/Videos consumers unchanged.
   */
  paddingTop?: number;
  /** When true, applies scroll-snap to children. Default true. */
  snap?: boolean;
}

/**
 * Pro Shop primitive — horizontal scroll rail with consistent padding,
 * gap, and scroll-snap behaviour. Children should set their own width.
 */
function HRailInner({
  children,
  paddingBottom = 16,
  paddingTop = 0,
  snap = true,
}: HRailProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        // Phase 5a: left-only 20px inset so first tile has breathing room
        // from the viewport edge. Right edge intentionally has zero padding
        // so tiles bleed off-viewport, signalling "more to scroll".
        padding: `${paddingTop}px 0 ${paddingBottom}px 20px`,
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: snap ? 'x mandatory' : 'none',
      }}
    >
      {children}
    </div>
  );
}

export const HRail = memo(HRailInner);
