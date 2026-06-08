/**
 * Ticker — Live state auto-scrolling top-10 marquee.
 * §5.1 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';

import {
  INK,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { SCORE_OVER_PAR_DARK_PALE } from '../../../_shared/tokens';
import type { TickerRow } from '../HybridHero.utils';
import { fmtScore } from '../HybridHero.utils';

// Pass 5.7: localized — was a shared constant with only this consumer.
// Height of the live-state top-10 ticker band rendered inside MiddleBand.
const TICKER_HEIGHT = 40;

interface TickerProps {
  rows: TickerRow[];
}

function entryScoreColour(score: number): string {
  if (score < 0) return SCORE_OVER_PAR_DARK_PALE; // under par -> red
  if (score > 0) return 'rgba(255,255,255,0.55)'; // over par -> muted white
  return 'white';
}

function TickerEntry({ row }: { row: TickerRow }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginRight: 14 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>{row.rank}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>{row.shortName}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: entryScoreColour(row.score) }}>
        {fmtScore(row.score)}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.20)', marginLeft: 6 }}>·</span>
    </span>
  );
}

export function Ticker({ rows }: TickerProps) {
  if (!rows || rows.length === 0) {
    return <div style={{ height: TICKER_HEIGHT, background: INK }} aria-hidden="true" />;
  }
  const doubled = [...rows, ...rows];
  return (
    <div
      aria-hidden="true"
      style={{
        height: TICKER_HEIGHT,
        background: INK,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Fixed left label */}
      <div
        style={{
          padding: '0 12px',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.50)',
          flexShrink: 0,
          zIndex: 2,
          background: INK,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        
        TOP 10
      </div>
      {/* Marquee track */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          className="hybrid-marquee-track"
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            ...NUMERIC_STYLE,
            fontSize: 12,
            paddingLeft: 16,
            whiteSpace: 'nowrap',
          }}
        >
          {doubled.map((r, i) => (
            <TickerEntry key={i} row={r} />
          ))}
        </div>
        {/* Right edge fade */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 40,
            height: '100%',
            background: `linear-gradient(90deg, transparent 0%, ${INK} 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
