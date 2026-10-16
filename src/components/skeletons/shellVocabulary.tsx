import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CHIP_RADIUS } from '@/components/explore-tab-new/courseled/tokens';

/**
 * SHARED SHELL VOCABULARY (BRIEF_COURSES_SKELETONS 1.1) — moved verbatim in
 * geometry from explore-tab-new/courseled/DiscoverSectionShells.tsx so Discover
 * and the courses area draw from ONE set of shell primitives. Do not write a
 * third vocabulary.
 *
 * MEASURING DISCIPLINE: a shell's every number is the real geometry of the
 * component it stands in for, read from that component's constant where one
 * exists. Shells never start larger than the smallest settled state.
 *
 * ONE SHIMMER (1.2): every bar is the Skeleton primitive (clb-shimmer-dark).
 * Its dark base is --surface-alt, the same #1E1E23 the old inline
 * MEMBER_CELL fill restated, so the move changes no pixel. Radius is the
 * shell's statement about the real element (CHIP_RADIUS by default; a shell
 * passes 0 only where the real element is square).
 */
export function Bar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <Skeleton aria-hidden className={className} style={{ borderRadius: CHIP_RADIUS, ...style }} />;
}

/**
 * BRIEF_DISCOVER_EYEBROWS §5 — a 10px uppercase eyebrow at lineHeight 1 with no
 * icon, plus the subline that follows it: a fixed 20 + 19.
 */
export function EyebrowBar({ w = 150, aside = false }: { w?: number; aside?: boolean }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px', height: 20 }}>
        <Bar style={{ height: 9, width: w }} />
        {aside ? <Bar style={{ height: 9, width: 44, marginLeft: 'auto' }} /> : null}
      </div>
      <div style={{ height: 19, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
        <Bar style={{ height: 10, width: 196 }} />
      </div>
    </>
  );
}

export function TextBar({ w, h = 11 }: { w: number | string; h?: number }) {
  return <Bar style={{ height: h, width: w }} />;
}
