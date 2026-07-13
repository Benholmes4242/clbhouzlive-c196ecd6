import React from 'react';
import {
  INK,
  SC_FILL_GOLD,
  SC_FILL_BIRDIE,
  SC_FILL_BOGEY,
  SC_FILL_DOUBLE,
  SC_PAR,
  SC_PAR_DARK,
} from '@/features/courses/components/holes/_constants';

/**
 * ScoreMark - the universal scoring-mark renderer.
 *
 * "World Feed" filled-chip system, shared across:
 *  - Tour scorecard sheet (PlayerScorecardSheet / leaderboard ScorecardSheet)
 *  - Handicap personal scorecard (RoundHoleCell / RoundDetailSheet)
 *  - Course Holes tab
 *
 * Grammar:
 *  - birdie: solid red disc, white numeral
 *  - eagle:  solid gold disc, INK numeral
 *  - alba / hio: solid gold disc, INK numeral, + one outer gold ring (rarity)
 *  - bogey:  solid blue rounded square, white numeral
 *  - doub / triple: solid navy rounded square, white numeral, + one outer navy frame
 *  - par:    bare numeral, no chip
 *  - empty:  bare dot
 *
 * Fills are shared across light and dark surfaces. Only the par numeral ink
 * and the outer ring "gap" colour (surface bg) differ by surface.
 */

type Variant =
  | 'empty'
  | 'par'
  | 'birdie'
  | 'eagle'
  | 'alba'
  | 'hio'
  | 'bogey'
  | 'doub'
  | 'triple';

const variantFor = (strokes: number | null | undefined, par: number): Variant => {
  if (strokes == null || strokes <= 0) return 'empty';
  if (strokes === 1) return 'hio';
  const diff = strokes - par;
  if (diff <= -3) return 'alba';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'doub';
  return 'triple';
};

interface ChipSpec {
  shape: 'circle' | 'square' | null;
  fill: string;
  ink: string;   // numeral colour on chip
  ring: boolean; // outer rarity ring (alba/hio for gold, doub/triple for navy)
  ringStroke: string;
}

const CHIP: Record<Variant, ChipSpec> = {
  empty:  { shape: null,     fill: 'transparent',   ink: '#CBD5E1', ring: false, ringStroke: 'transparent' },
  par:    { shape: null,     fill: 'transparent',   ink: SC_PAR,    ring: false, ringStroke: 'transparent' },
  birdie: { shape: 'circle', fill: SC_FILL_BIRDIE,  ink: '#FFFFFF', ring: false, ringStroke: 'transparent' },
  eagle:  { shape: 'circle', fill: SC_FILL_GOLD,    ink: INK,       ring: false, ringStroke: 'transparent' },
  alba:   { shape: 'circle', fill: SC_FILL_GOLD,    ink: INK,       ring: true,  ringStroke: SC_FILL_GOLD },
  hio:    { shape: 'circle', fill: SC_FILL_GOLD,    ink: INK,       ring: true,  ringStroke: SC_FILL_GOLD },
  bogey:  { shape: 'square', fill: SC_FILL_BOGEY,   ink: '#FFFFFF', ring: false, ringStroke: 'transparent' },
  doub:   { shape: 'square', fill: SC_FILL_DOUBLE,  ink: '#FFFFFF', ring: true,  ringStroke: SC_FILL_DOUBLE },
  triple: { shape: 'square', fill: SC_FILL_DOUBLE,  ink: '#FFFFFF', ring: true,  ringStroke: SC_FILL_DOUBLE },
};

export interface ScoreMarkProps {
  strokes: number | null | undefined;
  par: number;
  /** Visual size of the mark tile in px. Defaults to 38. */
  size?: number;
  /** Render the stroke numeral inside the mark. Defaults to true. */
  showStroke?: boolean;
  /** Override colour resolution (rarely used - forces numeral colour). */
  colourOverride?: string;
  /** Custom font for the numeral. */
  fontFamily?: string;
  /** Surface the mark lives on. Defaults to 'light'. Affects par ink only. */
  surface?: 'light' | 'dark';
}

const FONT_GEIST = "'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

export const ScoreMark: React.FC<ScoreMarkProps> = ({
  strokes,
  par,
  size = 38,
  showStroke = true,
  colourOverride,
  fontFamily = FONT_GEIST,
  surface = 'light',
}) => {
  const variant = variantFor(strokes, par);
  const chip = CHIP[variant];

  // Chip inset from tile edge (leaves room for the outer rarity ring).
  // With ring: leave ~4.5px total (2px stroke + 2.5px gap) at size=38.
  const RING_STROKE = Math.max(1.4, size * (2 / 38));
  const RING_GAP    = Math.max(1.6, size * (2.5 / 38));
  const CHIP_INSET  = chip.ring ? RING_STROKE + RING_GAP : 0;
  const chipSize    = size - CHIP_INSET * 2;

  const numeral = strokes == null ? '\u00B7' : strokes;

  const parInk = surface === 'dark' ? SC_PAR_DARK : SC_PAR;
  const emptyInk = surface === 'dark' ? 'rgba(242,244,247,0.35)' : '#CBD5E1';

  let numColour: string;
  if (colourOverride) numColour = colourOverride;
  else if (variant === 'empty') numColour = emptyInk;
  else if (variant === 'par') numColour = parInk;
  else numColour = chip.ink;

  const numWeight = variant === 'par' || variant === 'empty' ? 700 : 800;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'visible',
      }}
    >
      {chip.ring && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: chip.shape === 'square' ? Math.round(size * 0.22) : '50%',
            border: `${RING_STROKE}px solid ${chip.ringStroke}`,
            pointerEvents: 'none',
          }}
        />
      )}
      {chip.shape && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: CHIP_INSET,
            top: CHIP_INSET,
            width: chipSize,
            height: chipSize,
            borderRadius: chip.shape === 'square' ? Math.round(chipSize * 0.22) : '50%',
            background: chip.fill,
            pointerEvents: 'none',
          }}
        />
      )}
      {showStroke && (
        <span
          style={{
            position: 'relative',
            fontFamily,
            fontSize: Math.round(size * 0.42),
            fontWeight: numWeight,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: numColour,
          }}
        >
          {numeral}
        </span>
      )}
    </div>
  );
};

export default ScoreMark;
