import { memo } from 'react';

interface HRailProps {
  children: React.ReactNode;
  /** Padding-bottom in px (default 16). */
  paddingBottom?: number;
  /** When true, applies scroll-snap to children. Default true. */
  snap?: boolean;
}

/**
 * Pro Shop primitive — horizontal scroll rail with consistent padding,
 * gap, and scroll-snap behaviour. Children should set their own width.
 */
function HRailInner({ children, paddingBottom = 16, snap = true }: HRailProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        padding: `0 16px ${paddingBottom}px`,
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
