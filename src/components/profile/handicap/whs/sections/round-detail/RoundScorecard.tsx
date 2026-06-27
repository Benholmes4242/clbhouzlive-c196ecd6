import React, { useMemo } from 'react';
import RoundHoleCell from './RoundHoleCell';
import type { WhsScoreHole } from '@/lib/whs/types';
import { nineSeverityTint } from './_shared/nineSeverityTint';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';

interface Props {
  holes: WhsScoreHole[];
  isNineHole: boolean;
  isLight?: boolean;
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const NineGrid: React.FC<{ label: string; holes: WhsScoreHole[]; isLast?: boolean }> = ({ label, holes, isLast }) => {
  const total = holes.reduce(
    (s, h) => s + (h.played ? (h.adjusted_gross ?? h.actual_gross ?? 0) : 0),
    0,
  );
  const par = holes.reduce((s, h) => s + (h.par ?? 0), 0);
  const toPar = total - par;
  const palette = nineSeverityTint(toPar);
  const toParLabel = toPar === 0 ? 'E' : `${toPar > 0 ? '+' : ''}${toPar}`;

  return (
    <div style={{ marginBottom: isLast ? 0 : 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--hcp-t-100)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            padding: '3px 9px',
            background: palette.bgTint,
            borderRadius: 999,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.numColor,
              fontFamily: FONT_GEIST,
              letterSpacing: '-0.02em',
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: palette.deltaColor,
              letterSpacing: '0.02em',
            }}
          >
            {toParLabel}
          </span>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
        {holes.map((h) => (
          <RoundHoleCell key={`s-${h.hole_no}`} hole={h} />
        ))}
      </div>
    </div>
  );
};

export const RoundScorecard: React.FC<Props> = ({ holes, isNineHole, isLight = false }) => {
  const sorted = useMemo(
    () => [...holes].sort((a, b) => a.hole_no - b.hole_no),
    [holes],
  );
  const front9 = sorted.filter((h) => h.hole_no <= 9);
  const back9 = isNineHole ? [] : sorted.filter((h) => h.hole_no > 9);

  return (
    <div style={{ padding: '14px 0 28px', fontFamily: FONT_GEIST }}>
      <div style={{ padding: '0 18px', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: isLight ? '#0F172A' : '#FFFFFF',
            textTransform: 'uppercase',
          }}
        >
          SCORECARD
        </span>
      </div>
      <div style={{ padding: '0 18px' }}>
        <NineGrid label="Front 9" holes={front9} isLast={isNineHole || back9.length === 0} />
        {!isNineHole && back9.length > 0 && <NineGrid label="Back 9" holes={back9} isLast />}
      </div>

      {/* legend — refined-outline shape key; Ace/Albatross appear only when present in this round */}
      {(() => {
        const strokesOf = (h: WhsScoreHole) => h.adjusted_gross ?? h.actual_gross ?? null;
        const hasAce = sorted.some((h) => strokesOf(h) === 1);
        const hasAlbatross = sorted.some((h) => {
          const s = strokesOf(h);
          return s != null && h.par != null && (s - h.par) <= -3 && s !== 1;
        });
        const keyItems: Array<[string, number, number]> = [
          ...(hasAce ? [['Ace', 1, 4] as [string, number, number]] : []),
          ...(hasAlbatross ? [['Albatross', 2, 5] as [string, number, number]] : []),
          ['Eagle',  2, 4],
          ['Birdie', 3, 4],
          ['Par',    4, 4],
          ['Bogey',  5, 4],
          ['Dbl+',   6, 4],
        ];
        return (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, padding: '14px 18px 0', flexWrap: 'wrap' }}>
            {keyItems.map(([lbl, strokes, par]) => (
              <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <ScoreMark strokes={strokes} par={par} size={22} fontFamily={FONT_GEIST} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--hcp-t-60)', textAlign: 'center' }}>{lbl}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

export default RoundScorecard;
