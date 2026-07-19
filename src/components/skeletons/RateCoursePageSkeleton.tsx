/**
 * RateCoursePageSkeleton
 * Mirrors ReviewComposerV2's layout: fixed header, live preview card,
 * Overall scrubber, 2x2 category grid, textarea, media tray, pinned bar.
 * Used as BOTH the route Suspense fallback and the in-component data hold
 * so chunk-load and data-load read as one continuous state.
 */

import React from 'react';

const CANVAS = '#F8FAFC';
const TILE = '#EEF1F4';
const HAIRLINE = 'rgba(0,0,0,0.07)';
const CARD_RADIUS = 18;
const PANEL_RADIUS = 14;

function Block({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="clb-shimmer-light"
      style={{ background: TILE, borderRadius: 6, ...style }}
    />
  );
}

function Eyebrow() {
  return (
    <Block style={{ width: 96, height: 10, borderRadius: 3, marginBottom: 12 }} />
  );
}

export const RateCoursePageSkeleton = () => {
  return (
    <div style={{ minHeight: '100vh', background: CANVAS, display: 'flex', flexDirection: 'column' }}>
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
          borderBottom: `0.5px solid ${HAIRLINE}`,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 10px' }}>
          <Block style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Block style={{ width: 140, height: 14, marginBottom: 6 }} />
            <Block style={{ width: 180, height: 11 }} />
          </div>
        </div>
        <div style={{ height: 2, background: HAIRLINE }} />
      </header>

      {/* Header spacer (matches 54px in RV2) */}
      <div aria-hidden style={{ height: 54, flexShrink: 0 }} />

      {/* Live preview card */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${HAIRLINE}`,
            borderRadius: CARD_RADIUS,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Block style={{ width: 36, height: 36, borderRadius: 999 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Block style={{ width: 120, height: 12, marginBottom: 6 }} />
              <Block style={{ width: 80, height: 10 }} />
            </div>
            <Block style={{ width: 44, height: 20, borderRadius: 999 }} />
          </div>
          <Block style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12 }} />
          <Block style={{ width: '92%', height: 12, marginBottom: 6 }} />
          <Block style={{ width: '68%', height: 12 }} />
        </div>
      </div>

      {/* Overall */}
      <section style={{ padding: '0 16px 12px' }}>
        <Eyebrow />
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${HAIRLINE}`,
            borderRadius: PANEL_RADIUS,
            padding: '14px 16px',
          }}
        >
          <Block style={{ width: '100%', height: 28, borderRadius: 999 }} />
        </div>
      </section>

      {/* Category scores: 2x2 grid */}
      <section style={{ padding: '0 16px 12px' }}>
        <Eyebrow />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${HAIRLINE}`,
                borderRadius: PANEL_RADIUS,
                padding: 14,
              }}
            >
              <Block style={{ width: 60, height: 10, marginBottom: 10 }} />
              <Block style={{ width: '100%', height: 22, borderRadius: 999 }} />
            </div>
          ))}
        </div>
      </section>

      {/* Thoughts textarea */}
      <section style={{ padding: '0 16px 12px' }}>
        <Eyebrow />
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${HAIRLINE}`,
            borderRadius: PANEL_RADIUS,
            padding: 14,
            minHeight: 96,
          }}
        >
          <Block style={{ width: '90%', height: 12, marginBottom: 8 }} />
          <Block style={{ width: '72%', height: 12, marginBottom: 8 }} />
          <Block style={{ width: '40%', height: 12 }} />
        </div>
      </section>

      {/* Photos & video tray */}
      <section style={{ padding: '0 16px 12px' }}>
        <Eyebrow />
        <div style={{ display: 'flex', gap: 10 }}>
          <Block style={{ width: 72, height: 72, borderRadius: 12 }} />
          <Block style={{ width: 72, height: 72, borderRadius: 12 }} />
          <Block style={{ width: 72, height: 72, borderRadius: 12 }} />
        </div>
      </section>

      {/* Share toggle row */}
      <section style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Block style={{ width: 140, height: 14 }} />
        <Block style={{ width: 44, height: 24, borderRadius: 999 }} />
      </section>

      <div style={{ flex: 1 }} />

      {/* Pinned submit bar mirror */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, #F8FAFC 30%)',
        }}
      >
        <Block style={{ width: '100%', height: 52, borderRadius: 14 }} />
      </div>
    </div>
  );
};
