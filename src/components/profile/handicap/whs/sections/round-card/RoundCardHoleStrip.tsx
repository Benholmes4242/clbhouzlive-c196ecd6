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

type Shape = 'circle' | 'square' | 'empty';

const ShapePath: React.FC<{
  kind: 'circle' | 'square';
  inset: number;
  stroke: string;
  size: number;
}> = ({ kind, inset, stroke, size }) => {
  if (kind === 'circle') {
    const r = size / 2 - inset - STRIP_STROKE / 2;
    if (r <= 0) return null;
    return (
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={STRIP_STROKE}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  const dim = size - 2 * inset - STRIP_STROKE;
  if (dim <= 0) return null;
  return (
    <rect
      x={inset + STRIP_STROKE / 2}
      y={inset + STRIP_STROKE / 2}
      width={dim}
      height={dim}
      rx={2}
      ry={2}
      fill="none"
      stroke={stroke}
      strokeWidth={STRIP_STROKE}
      vectorEffect="non-scaling-stroke"
    />
  );
};

const HoleCell: React.FC<{
  score: number | null;
  par: number;
  size?: number;
}> = ({ score, par, size = 20 }) => {
  let shape: Shape = 'empty';
  let depth: 1 | 2 = 1;
  let stroke = INK_20;
  let numeralColor: string = INK;

  if (score != null) {
    const diff = score - par;
    if (score === 1 || diff <= -2) {
      shape = 'circle'; depth = 2; stroke = AMBER_GRAD; numeralColor = INK;
    } else if (diff === -1) {
      shape = 'circle'; depth = 1; stroke = AMBER_GRAD; numeralColor = INK;
    } else if (diff === 0) {
      shape = 'square'; depth = 1; stroke = INK_20;
    } else if (diff === 1) {
      shape = 'square'; depth = 1; stroke = INK_55;
    } else {
      shape = 'square'; depth = 2; stroke = INK_85;
    }
  }

  const showNumeral = score != null && score < 10;
  const showOverflowMarker = score != null && score >= 10;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: '0 0 auto',
      }}
    >
      {shape !== 'empty' && (
        <>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ position: 'absolute', inset: 0, display: 'block' }}
          >
            <ShapePath kind={shape} inset={0.5} stroke={stroke} size={size} />
            {depth >= 2 && (
              <ShapePath kind={shape} inset={3} stroke={stroke} size={size} />
            )}
          </svg>
          {showNumeral && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: numeralColor,
                fontVariantNumeric: 'tabular-nums lining-nums',
                lineHeight: 1,
                fontFamily: FONT_SF,
              }}
            >
              {score}
            </div>
          )}
          {showOverflowMarker && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: numeralColor,
                lineHeight: 1,
              }}
            >
              +
            </div>
          )}
        </>
      )}
      {shape === 'empty' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: INK_20,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  );
};

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
