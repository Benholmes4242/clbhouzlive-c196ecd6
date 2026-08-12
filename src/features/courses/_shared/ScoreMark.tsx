import React from 'react';
import {
  INK,
  SC_FILL_GOLD,
  SC_FILL_BIRDIE,
  SC_PAR,
  SC_PAR_DARK,
} from '@/features/courses/components/holes/_constants';

/**
 * ScoreMark - the universal scoring-mark renderer.
 *
 * House grammar is OUTLINES, not fills (CORRECTION_ONE_SCORING_MARK).
 * Shared across:
 *  - Card scorecard sheet (CardScorecardSheet)
 *  - Handicap personal scorecard
 *  - Course Holes tab legend
 *  - Clubhouse feed round card (surface="dark")
 *
 * Grammar:
 *  - birdie (-1)        circle,        under-par red
 *  - eagle (-2)         double circle, under-par red
 *  - albatross (-3)     double circle, under-par red, + outer GOLD ring
 *  - hole in one (1)    double circle, under-par red, + outer GOLD ring
 *  - par (0)            bare numeral, no mark
 *  - bogey (+1)         square,        over-par ink
 *  - double or worse    double square, over-par ink
 *  - no score           bare dot
 *
 * Only the over-par mark and the par numeral vary by surface. Red reads on both.
 */

type Variant =
  | 'empty'
  | 'par'
  | 'birdie'
  | 'eagle'
  | 'alba'
  | 'hio'
  | 'bogey'
  | 'doub';

const variantFor = (strokes: number | null | undefined, par: number): Variant => {
  if (strokes == null || strokes <= 0) return 'empty';
  if (strokes === 1) return 'hio';
  const diff = strokes - par;
  if (diff <= -3) return 'alba';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  return 'doub';
};

const OVER_INK_LIGHT = INK;
const OVER_INK_DARK = '#F2F4F7';

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
  /** Surface the mark lives on. Defaults to 'light'. */
  surface?: 'light' | 'dark';
}

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const ScoreMark: React.FC<ScoreMarkProps> = ({
  strokes,
  par,
  size = 38,
  showStroke = true,
  colourOverride,
  fontFamily = FONT_SF,
  surface = 'light',
}) => {
  const variant = variantFor(strokes, par);

  const under = variant === 'birdie' || variant === 'eagle' || variant === 'alba' || variant === 'hio';
  const over = variant === 'bogey' || variant === 'doub';
  const shape: 'circle' | 'square' | null = under ? 'circle' : over ? 'square' : null;
  const doubleMark = variant === 'eagle' || variant === 'alba' || variant === 'hio' || variant === 'doub';
  const goldRing = variant === 'alba' || variant === 'hio';

  const overInk = surface === 'dark' ? OVER_INK_DARK : OVER_INK_LIGHT;
  const parInk = surface === 'dark' ? SC_PAR_DARK : SC_PAR;
  const emptyInk = surface === 'dark' ? 'rgba(242,244,247,0.35)' : '#CBD5E1';

  const tone = under ? SC_FILL_BIRDIE : overInk;

  const STROKE = Math.max(1.3, size * (1.5 / 26));
  const OUTER_R = shape === 'square' ? Math.max(3, size * 0.12) : '50%';
  const INNER_INSET = Math.max(2, size * 0.09);
  const INNER_R = shape === 'square' ? Math.max(2, size * 0.09) : '50%';

  // Gold rarity ring sits outside the mark; inset the mark to make room.
  const RING_GAP = Math.max(1.6, size * (2.5 / 38));
  const MARK_INSET = goldRing ? STROKE + RING_GAP : 0;

  const numeral = strokes == null || strokes <= 0 ? '\u00B7' : strokes;

  let numColour: string;
  if (colourOverride) numColour = colourOverride;
  else if (variant === 'empty') numColour = emptyInk;
  else if (variant === 'par') numColour = parInk;
  else numColour = tone;

  const numWeight = variant === 'par' || variant === 'empty' ? 700 : 800;

  return (
    <span
      style={{
        position: 'relative',
        width: size,
        height: size,
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        overflow: 'visible',
      }}
    >
      {goldRing && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `${STROKE}px solid ${SC_FILL_GOLD}`,
            pointerEvents: 'none',
          }}
        />
      )}
      {shape && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: MARK_INSET,
            borderRadius: OUTER_R,
            border: `${STROKE}px solid ${tone}`,
            pointerEvents: 'none',
          }}
        />
      )}
      {shape && doubleMark && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: MARK_INSET + INNER_INSET,
            borderRadius: INNER_R,
            border: `${STROKE}px solid ${tone}`,
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
            fontFeatureSettings: '"zero" 0',
            color: numColour,
          }}
        >
          {numeral}
        </span>
      )}
    </span>
  );
};

export default ScoreMark;
