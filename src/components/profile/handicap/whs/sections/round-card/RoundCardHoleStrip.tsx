/**
 * RoundCardHoleStrip — hole-by-hole strip for light-themed round cards.
 * Used by both LastRoundCard (own) and FriendsYesterdayCard (enriched).
 *
 * The marks are NOT drawn here any more. They are `ScoreMark`, the app's one
 * scoring-mark renderer (SCORE MARK PILL grammar): solid red under par, ink
 * ground over par, bare par, ring at two-or-more from par, gold only on an ace
 * or albatross. This file used to hold a fourth private copy of an older
 * amber-circle / ink-square vocabulary; that copy is gone.
 */
import React from 'react';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';


export interface HoleRow {
  hole_no: number;
  par: number | null;
  actual_gross: number | null;
  adjusted_gross: number | null;
  played: boolean;
  hole_alias?: string | null;
}

/** One cell = one ScoreMark at the strip's existing 20px geometry. */
const HoleCell: React.FC<{
  score: number | null;
  par: number;
  size?: number;
}> = ({ score, par, size = 20 }) => (
  <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
    <ScoreMark strokes={score} par={par} size={size} surface="light" />
  </div>
);


const NineRow: React.FC<{ label: string; holes: HoleRow[] }> = ({ label, holes }) => {
  const total = holes.reduce(
    (s, h) => s + (h.played ? (h.adjusted_gross ?? h.actual_gross ?? 0) : 0),
    0,
  );
  const parTotal = holes.reduce((s, h) => s + (h.par ?? 0), 0);
  const anyPlayed = holes.some(
    (h) => h.played && (h.adjusted_gross != null || h.actual_gross != null),
  );
  const delta = anyPlayed ? total - parTotal : 0;
  const deltaStr = anyPlayed
    ? delta === 0 ? 'E' : delta > 0 ? `+${delta}` : `${delta}`
    : '';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: FONT_SF,
      }}
    >
      <div
        style={{
          width: 24,
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--hcp-t-60)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${holes.length}, 1fr)`,
          gap: 2,
          minWidth: 0,
        }}
      >
        {holes.map((h, i) => {
          const score = h.played ? (h.adjusted_gross ?? h.actual_gross ?? null) : null;
          return <HoleCell key={i} score={score} par={h.par ?? 0} />;
        })}
      </div>
      <div
        style={{
          minWidth: 44,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'flex-end',
          gap: 4,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--hcp-t-100)' }}>
          {anyPlayed ? total : '\u2014'}
        </span>
        {anyPlayed && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--hcp-t-60)',
              letterSpacing: '0.04em',
            }}
          >
            {deltaStr}
          </span>
        )}
      </div>
    </div>
  );
};

export const RoundCardHoleStrip: React.FC<{ holes: HoleRow[] }> = ({ holes }) => {
  const sorted = [...holes].sort((a, b) => a.hole_no - b.hole_no);
  const front9 = sorted.filter(h => h.hole_no <= 9);
  const back9 = sorted.filter(h => h.hole_no > 9);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="hsAmberGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7931E" />
            <stop offset="100%" stopColor="#FBBC2E" />
          </linearGradient>
        </defs>
      </svg>
      <NineRow label="OUT" holes={front9} />
      {back9.length > 0 && <NineRow label="IN" holes={back9} />}
    </div>
  );
};
