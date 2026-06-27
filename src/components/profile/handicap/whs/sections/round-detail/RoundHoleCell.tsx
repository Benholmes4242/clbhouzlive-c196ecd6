import React from 'react';
import type { WhsScoreHole } from '@/lib/whs/types';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';

interface Props {
  hole: WhsScoreHole;
  showPar?: boolean;
}

const FONT_GEIST =
  'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// ─── RoundHoleCell ─────────────────────────────────────────────────────
// Thin wrapper around the universal ScoreMark renderer. Adds the hole-number
// label above and the par label below the tile — the layout chrome that's
// specific to the handicap personal scorecard.
export const RoundHoleCell: React.FC<Props> = ({ hole, showPar = true }) => {
  const strokes = hole.played
    ? (hole.adjusted_gross ?? hole.actual_gross ?? null)
    : null;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        fontFamily: FONT_GEIST,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: 'var(--hcp-t-60)',
          letterSpacing: '0.04em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {hole.hole_no}
      </span>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 38,
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ScoreMark
          strokes={strokes}
          par={hole.par}
          size={38}
          fontFamily={FONT_GEIST}
        />
      </div>

      {showPar && hole.par != null && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: 'var(--hcp-t-40)',
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          par {hole.par}
        </span>
      )}
    </div>
  );
};

export default RoundHoleCell;
