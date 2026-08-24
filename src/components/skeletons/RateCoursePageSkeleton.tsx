/**
 * RateCoursePageSkeleton
 * Mirrors ReviewComposerV2 step 0 (Score): fixed header, 3-segment step rail,
 * heading, single overall-scrubber card, pinned submit bar.
 * Used as BOTH the route Suspense fallback and the in-component data hold
 * so chunk-load and data-load read as one continuous state.
 */

import React from 'react';
import { RV2 } from '@/features/review-v2/tokens';

const CANVAS = RV2.canvas;
const TILE = RV2.ghost;
const HAIRLINE = RV2.hairline;

function Block({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="clb-shimmer-light"
      style={{ background: TILE, borderRadius: 6, ...style }}
    />
  );
}

export const RateCoursePageSkeleton = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: CANVAS,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Fixed header mirror */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          margin: '0 auto',
          width: '100%',
          maxWidth: 480,
          zIndex: 50,
          background: CANVAS,
          borderBottom: `1px solid ${HAIRLINE}`,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 10px' }}>
          <Block style={{ width: 44, height: 44, borderRadius: 10 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Block style={{ width: 170, height: 13, marginBottom: 6 }} />
            <Block style={{ width: 110, height: 10 }} />
          </div>
        </div>
      </header>

      {/* Header spacer (matches 54px in RV2) */}
      <div aria-hidden style={{ height: 54, flexShrink: 0 }} />

      {/* Step rail mirror — 3 segments, first active */}
      <div aria-hidden style={{ display: 'flex', gap: 6, padding: '14px 16px 18px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1 }}>
            <div
              style={{
                height: 3,
                borderRadius: 999,
                marginBottom: 6,
                background: i === 0 ? RV2.dark : 'rgba(255,255,255,0.12)',
              }}
            />
            <Block style={{ width: i === 0 ? 44 : 56, height: 8, borderRadius: 3 }} />
          </div>
        ))}
      </div>

      {/* Step 0 — heading + overall scrubber card */}
      <section style={{ padding: '0 16px 16px' }}>
        <Block style={{ width: '62%', height: 20, borderRadius: 5, marginBottom: 16 }} />
        <div
          style={{
            background: RV2.cardBg,
            borderRadius: RV2.cardRadius,
            border: `1px solid ${HAIRLINE}`,
            padding: '18px 18px 16px',
          }}
        >
          {/* big value + band label */}
          <Block style={{ width: 92, height: 40, borderRadius: 8, marginBottom: 14 }} />
          {/* scrubber track */}
          <Block style={{ width: '100%', height: 34, borderRadius: 999, marginBottom: 14 }} />
          {/* tick labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <Block style={{ width: 22, height: 9, borderRadius: 3 }} />
            <Block style={{ width: 22, height: 9, borderRadius: 3 }} />
            <Block style={{ width: 22, height: 9, borderRadius: 3 }} />
          </div>
          {/* caption */}
          <Block style={{ width: '74%', height: 11, borderRadius: 3 }} />
        </div>
      </section>

      <div style={{ flex: 1, minHeight: 16 }} />

      {/* Pinned submit bar mirror */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)',
          background: CANVAS,
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        <Block style={{ width: '100%', height: 52, borderRadius: 999 }} />
      </div>
    </div>
  );
};
