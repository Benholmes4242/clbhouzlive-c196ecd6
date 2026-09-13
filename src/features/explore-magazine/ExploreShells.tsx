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

/**
 * THE FAILED SHELF (BRIEF_EXPLORE_MAGAZINE PHASE D §5b).
 *
 * ERRORED IS NOT EMPTY. A shelf whose source THREW renders this row and offers
 * the read again; a shelf that settled EMPTY still renders nothing. The two
 * states looked identical for as long as the sources returned [] on failure,
 * which is exactly how a broken read stays broken forever.
 *
 * It is deliberately the quietest possible row: one line of MUTE text and one
 * INK action, no icon, no panel, no amber — nothing here is a member's own
 * doing, and nothing here is a Post control.
 */
export function ShelfRetry({
  heading,
  label,
  action,
  onRetry,
}: {
  heading: string;
  label: string;
  action: string;
  onRetry: () => void;
}) {
  return (
    <div style={{ fontFamily: SANS, padding: '0 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK }}>{heading}</div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 13, color: A.MUTE }}>{label}</span>
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            font: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            color: A.INK,
            cursor: 'pointer',
          }}
        >
          {action}
        </button>
      </div>
    </div>
  );
}
