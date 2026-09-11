import React from 'react';

import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { r } from '@/lib/radius';

/**
 * THE SHELLS (BRIEF_EXPLORE_MAGAZINE §9).
 *
 * ONE file, exported functions, never duplicated per block. Two rules govern
 * every shape here:
 *   A LOADING STATE IS NEVER LARGER THAN THE SMALLEST STATE IT RESOLVES INTO —
 *   so a cold start shows the STD shell, never the lead shell, and the surface
 *   expands outwards when the lead arrives.
 *   A FALLBACK ONLY RENDERS AFTER ITS SOURCE SETTLES — so these are shells, not
 *   gradients or initials.
 */

function Line({ width, height = 12 }: { width: number | string; height?: number }) {
  return (
    <div
      className="clb-shimmer-light"
      aria-hidden
      style={{ width, height, borderRadius: r.xs, background: A.TRACK, marginTop: 8 }}
    />
  );
}

function Block({ height, radius }: { height: number; radius: string }) {
  return (
    <div
      className="clb-shimmer-light"
      aria-hidden
      style={{ height, borderRadius: radius, background: A.TRACK, width: '100%' }}
    />
  );
}

export function StdShell() {
  return (
    <div aria-hidden style={{ fontFamily: SANS }}>
      <Block height={210} radius={r.md} />
      <div style={{ paddingInline: 4 }}>
        <Line width={92} height={8} />
        <Line width="86%" />
        <Line width="54%" height={11} />
      </div>
    </div>
  );
}

export function LeadShell() {
  return (
    <div aria-hidden style={{ fontFamily: SANS }}>
      <Block height={340} radius={r.lg} />
    </div>
  );
}

export function PairShell() {
  return (
    <div aria-hidden style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: SANS }}>
      {[0, 1].map((index) => (
        <div key={index}>
          <Block height={124} radius={r.md} />
          <div style={{ paddingInline: 4 }}>
            <Line width={64} height={8} />
            <Line width="90%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShelfShell({ tileW, tileH }: { tileW: number; tileH: number }) {
  return (
    <div aria-hidden style={{ fontFamily: SANS }}>
      <div style={{ padding: '0 16px' }}>
        <Line width={148} height={14} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, padding: '0 16px', overflow: 'hidden' }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="clb-shimmer-light"
            style={{ width: tileW, height: tileH, flex: `0 0 ${tileW}px`, borderRadius: r.md, background: A.TRACK }}
          />
        ))}
      </div>
    </div>
  );
}
