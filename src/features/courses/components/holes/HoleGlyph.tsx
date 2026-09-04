/**
 * HoleGlyph — the Holes-area renderer of the SCORE MARK PILL grammar.
 *
 * This file no longer owns a vocabulary. The grammar is BRIEF_SCORE_MARKS_PILL
 * §1/§2, authored in `ScoreMark.tsx`; HoleGlyph is only the SVG expression of it
 * for the Course Hole Data Sheet and the notation key.
 *
 * Grammar (light surfaces only — the Holes area is white):
 *   EVERY MARK IS A CIRCLE. Nothing is square.
 *   FILL   solid = under par · ground = over par · bare = par
 *   TONE   RED = under · INK = over · GOLD = ace / albatross ONLY
 *   RING   present when |strokes - par| >= 2, either direction
 *
 *   ace / albatross  solid RED + GOLD ring
 *   eagle            solid RED + RED ring
 *   birdie           solid RED
 *   par              BARE
 *   bogey            SOFT ink ground
 *   double+          DEEP ink ground + INK ring
 *
 * The old amber gradient stroke (url(#hsAmberGoldStroke)) is gone: gold now
 * appears a handful of times a year and uses the flat SC_FILL_GOLD token that
 * ScoreMark uses, so the two renderers cannot drift on the one colour they
 * still share. `HoleGlyphDefs` is kept as a no-op export for its existing mount
 * point and can be removed once that mount is retired.
 */
import React from 'react';
import {
  SC_FILL_BIRDIE_DK,
  SC_FILL_BOGEY_DK,
  SC_FILL_DOUBLE_DK,
  SC_FILL_GOLD,
  SC_FILL_TRIPLE_DK,
} from './_constants';

export type HoleGlyphKind =
  /** Kept for the callers that cannot yet tell an eagle from an ace: RED ring. */
  | 'eagle-or-better'
  /** Rarity only. Gold lives here and nowhere else. */
  | 'ace-or-albatross'
  | 'eagle'
  | 'birdie'
  | 'par'
  | 'bogey'
  | 'double-plus'
  | 'triple-plus';

const STRIP_STROKE = 1.4;

export const HoleGlyph: React.FC<{ kind: HoleGlyphKind; size?: number }> = ({
  kind,
  size = 20,
}) => {
  const under = kind === 'birdie' || kind === 'eagle' || kind === 'eagle-or-better' || kind === 'ace-or-albatross';
  const over = kind === 'bogey' || kind === 'double-plus' || kind === 'triple-plus';
  const ringCount = kind === 'ace-or-albatross'
    ? 2
    : kind === 'eagle' || kind === 'eagle-or-better' || kind === 'triple-plus'
      ? 1
      : 0;
  const ring = ringCount > 0;
  const gold = kind === 'eagle' || kind === 'eagle-or-better' || kind === 'ace-or-albatross';

  const fill = under
    ? gold ? SC_FILL_GOLD : SC_FILL_BIRDIE_DK
    : kind === 'double-plus'
      ? SC_FILL_DOUBLE_DK
      : kind === 'triple-plus'
        ? SC_FILL_TRIPLE_DK
        : 'none';
  const ringTone = gold ? SC_FILL_GOLD : SC_FILL_TRIPLE_DK;

  const RING_GAP = 1.4;
  const discInset = ring ? STRIP_STROKE + RING_GAP : 0;
  const discR = size / 2 - discInset;
  const ringR = size / 2 - STRIP_STROKE / 2 - 0.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
      aria-hidden
    >
      {Array.from({ length: ringCount }, (_, i) => {
        const radius = ringR - i * (STRIP_STROKE + RING_GAP);
        return radius > 0 ? (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringTone}
            strokeWidth={STRIP_STROKE}
            vectorEffect="non-scaling-stroke"
          />
        ) : null;
      })}
      {kind === 'bogey' && (
        <rect x={1} y={1} width={size - 2} height={size - 2} fill="none" stroke={SC_FILL_BOGEY_DK} strokeWidth={STRIP_STROKE} />
      )}
      {fill !== 'none' && discR > 0 && (
        under
          ? <circle cx={size / 2} cy={size / 2} r={discR} fill={fill} />
          : <rect x={discInset} y={discInset} width={size - discInset * 2} height={size - discInset * 2} fill={fill} />
      )}
    </svg>
  );
};

/**
 * No-op. The gradient this used to declare is gone (§2). Kept so the existing
 * mount in HoleDataSheet stays valid until that mount is removed.
 */
export const HoleGlyphDefs: React.FC = () => null;
