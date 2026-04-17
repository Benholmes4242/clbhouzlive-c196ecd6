/**
 * Skeleton placeholder for the Front Page editorial lede.
 *
 * Matches the dimensions of the real lede to prevent layout shift
 * when the editorial query resolves:
 *  - Eyebrow row (10–11px uppercase text height)
 *  - H2 two-line fragment (~28px × 1.05 line-height × 2 lines)
 *  - Standfirst three lines (~13px × 1.55 line-height × 3 lines)
 *
 * Used by all four Front Page tabs (Top 100, Global, Courses, Handicap)
 * while `useDailyEditorial` is in its pending state. Once the query
 * resolves, the consuming tab renders the real editorial or falls back
 * to its baseline template (the empty-state permanent content).
 */

import React from 'react';

const INK_GHOST = 'rgba(15,23,42,0.06)';

export function EditorialLedeSkeleton() {
  return (
    <div style={{ padding: '22px 20px 0' }} aria-hidden="true">
      {/* Eyebrow ghost */}
      <div
        style={{
          height: 10,
          width: '40%',
          background: INK_GHOST,
          borderRadius: 2,
          marginBottom: 14,
        }}
      />

      {/* H2 line 1 — wider */}
      <div
        style={{
          height: 28,
          width: '85%',
          background: INK_GHOST,
          borderRadius: 3,
          marginBottom: 8,
        }}
      />
      {/* H2 line 2 — narrower */}
      <div
        style={{
          height: 28,
          width: '60%',
          background: INK_GHOST,
          borderRadius: 3,
          marginBottom: 16,
        }}
      />

      {/* Standfirst — three short lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 13, width: '95%', background: INK_GHOST, borderRadius: 2 }} />
        <div style={{ height: 13, width: '90%', background: INK_GHOST, borderRadius: 2 }} />
        <div style={{ height: 13, width: '70%', background: INK_GHOST, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default EditorialLedeSkeleton;
