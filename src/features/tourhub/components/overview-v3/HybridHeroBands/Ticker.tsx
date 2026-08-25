/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
/**
 * Ticker — Live state auto-scrolling top-10 marquee.
 * §5.1 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { TOPAR_UNDER_DARK } from '../../../_shared/tokens';

import type { TickerRow } from '../HybridHero.utils';
import { fmtScore } from '../HybridHero.utils';

// Pass 5.7: localized — was a shared constant with only this consumer.
// Height of the live-state top-10 ticker band rendered inside MiddleBand.
const TICKER_HEIGHT = 34;

interface TickerProps {
  rows: TickerRow[];
}

function entryScoreColour(score: number): string {
  // ONE red for under par on dark — the token, not a literal, so the ticker and
  // the hero board can never drift into two reds that happen to agree today.
  if (score < 0) return TOPAR_UNDER_DARK;
  if (score > 0) return 'rgba(255,255,255,0.55)'; // over par -> muted white
  return 'white';
}

function TickerEntry({ row }: { row: TickerRow }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginRight: 14 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>{row.rank}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>{row.shortName}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: entryScoreColour(row.score) }}>
        {fmtScore(row.score)}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.20)', marginLeft: 6 }}>·</span>
    </span>
  );
}

export function Ticker({ rows }: TickerProps) {
  const { t } = useTranslation('tourhub');
  if (!rows || rows.length === 0) {
    return <div style={{ height: TICKER_HEIGHT, background: 'rgba(10,14,20,0.50)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} aria-hidden="true" />;
  }
  const doubled = [...rows, ...rows];
  return (
    <div
      aria-hidden="true"
      style={{
        height: TICKER_HEIGHT,
        background: 'rgba(10,14,20,0.50)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        borderTop: '0.5px solid rgba(255,255,255,0.18)',
      }}
    >
      {/* Fixed left label */}
      <div
        style={{
          padding: '0 12px',
          fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.50)',
          flexShrink: 0,
          zIndex: 2,
          background: 'rgba(10,14,20,0.50)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        
        {t('overview.ticker.top10Label')}
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
            background: 'linear-gradient(90deg, rgba(10,14,20,0) 0%, rgba(10,14,20,0.50) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
