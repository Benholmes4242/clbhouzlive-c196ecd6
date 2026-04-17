/**
 * Skeleton placeholder for the Front Page editorial lede.
 *
 * Matches the dimensions of the real lede to prevent layout shift
 * when the editorial query resolves. Centred to match app-wide
 * editorial alignment convention.
 */

import React from 'react';

const INK_GHOST = 'rgba(15,23,42,0.06)';

export function EditorialLedeSkeleton() {
  return (
    <div style={{ padding: '22px 20px 0', textAlign: 'center' }} aria-hidden="true">
      {/* Eyebrow ghost */}
      <div
        style={{
          height: 11,
          width: 160,
          background: INK_GHOST,
          borderRadius: 2,
          marginBottom: 10,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />

      {/* H2 line 1 — wider */}
      <div
        style={{
          height: 30,
          width: '85%',
          background: INK_GHOST,
          borderRadius: 3,
          marginBottom: 6,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />
      {/* H2 line 2 — narrower (italic second-line pattern) */}
      <div
        style={{
          height: 30,
          width: '55%',
          background: INK_GHOST,
          borderRadius: 3,
          marginBottom: 14,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />

      {/* Standfirst — three short lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <div style={{ height: 13, width: '92%', background: INK_GHOST, borderRadius: 2 }} />
        <div style={{ height: 13, width: '88%', background: INK_GHOST, borderRadius: 2 }} />
        <div style={{ height: 13, width: '60%', background: INK_GHOST, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export default EditorialLedeSkeleton;
