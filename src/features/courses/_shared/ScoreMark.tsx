import React from 'react';
import {
  INK,
  SC_FILL_GOLD,
  SC_FILL_BIRDIE,
  SC_FILL_BIRDIE_DK,
  SC_FILL_BOGEY_DK,
  SC_FILL_DOUBLE_DK,
  SC_FILL_TRIPLE_DK,
  SC_PAR,
  SC_PAR_DARK,
} from '@/features/courses/components/holes/_constants';

/**
 * ScoreMark - the universal scoring-mark renderer.
 *
 * Dark scorecards follow the paper-card convention: gold circles for eagle or
 * better, red circle for birdie, bare par, outlined-square bogey, blue square
 * double and deep-blue ringed square triple+. Rings encode degree. Light keeps
 * its established treatment unchanged.
 * Shared across:
 *  - Card scorecard sheet (CardScorecardSheet)
 *  - Handicap personal scorecard
 *  - Course Holes tab legend
 *  - Clubhouse feed round card (surface="dark")
 *
 * An ace has no bespoke branch: its mark is derived from strokes minus par.
 */

type Variant =
  | 'empty'
  | 'par'
  | 'birdie'
  | 'eagle'
  | 'alba'
  | 'bogey'
  | 'doub'
  | 'triple';

const variantFor = (strokes: number | null | undefined, par: number): Variant => {
  if (strokes == null || strokes <= 0) return 'empty';
  const diff = strokes - par;
  if (diff <= -3) return 'alba';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'doub';
  return 'triple';
};

const OVER_INK_LIGHT = INK;

/** These three are PINNED LOCALLY, not sourced from the tour ramp: that ramp is
    going dark and these serve the light path. Their values are unchanged from the
    tokens they replace (INK_TINT_06, HAIRLINE_INK_12) — this is a sourcing change
    only, with zero visual effect. */
const LIGHT_BOGEY_GROUND = 'rgba(15,23,42,0.06)';
const LIGHT_DOUBLE_GROUND = 'rgba(15,23,42,0.12)';
/** The under-par numeral: white text on a saturated red disc, on BOTH surfaces
    regardless of theme. It is not a surface token and must never be repointed by
    a surface change — that mis-naming (as SURFACE) was the original fault. */
const MARK_NUMERAL_ON_FILL = '#FFFFFF';
export interface ScoreMarkProps {
  strokes: number | null | undefined;
  par: number;
  /** Visual size of the mark tile in px. Defaults to 38. */
  size?: number;
  /** Render the stroke numeral inside the mark. Defaults to true. */
  showStroke?: boolean;
  /** Override colour resolution (rarely used - forces numeral colour). */
  colourOverride?: string;
  /** Surface the mark lives on. Defaults to 'light'. */
  surface?: 'light' | 'dark';
}

export const ScoreMark: React.FC<ScoreMarkProps> = ({
  strokes,
  par,
  size = 38,
  showStroke = true,
  colourOverride,
  surface = 'light',
}) => {
  const variant = variantFor(strokes, par);

  const under = variant === 'birdie' || variant === 'eagle' || variant === 'alba';
  const over = variant === 'bogey' || variant === 'doub' || variant === 'triple';
  const hasMark = under || over;
  const magnitudeRing = variant === 'eagle' || variant === 'alba' || variant === 'doub' || variant === 'triple';
  const goldRing = variant === 'alba';

  const overInk = OVER_INK_LIGHT;
  const parInk = surface === 'dark' ? SC_PAR_DARK : SC_PAR;
  const emptyInk = surface === 'dark' ? 'rgba(242,244,247,0.35)' : '#CBD5E1';
  const underRed = SC_FILL_BIRDIE;
  const overGround = variant === 'doub' || variant === 'triple'
    ? LIGHT_DOUBLE_GROUND
    : LIGHT_BOGEY_GROUND;
  const fill = under ? underRed : over ? overGround : 'transparent';
  const ringTone = goldRing ? SC_FILL_GOLD : under ? underRed : overInk;

  const STROKE = Math.max(1.3, size * (1.5 / 26));
  const RING_GAP = Math.max(1, size * (1.5 / 26));
  const DISC_INSET = magnitudeRing ? STROKE + RING_GAP : 0;

  const numeral = strokes == null || strokes <= 0 ? '\u00B7' : strokes;

  let numColour: string;
  if (colourOverride) numColour = colourOverride;
  else if (variant === 'empty') numColour = emptyInk;
  else if (variant === 'par') numColour = parInk;
  else if (under) numColour = MARK_NUMERAL_ON_FILL;
  else numColour = overInk;

  const numWeight = 700;

  if (surface === 'dark') {
    const ringCount = variant === 'alba' ? 2 : variant === 'eagle' || variant === 'triple' ? 1 : 0;
    const shape = over ? '0%' : '50%';
    const darkFill =
      variant === 'birdie'
        ? SC_FILL_BIRDIE_DK
        : variant === 'eagle' || variant === 'alba'
          ? SC_FILL_GOLD
          : variant === 'doub'
            ? SC_FILL_DOUBLE_DK
            : variant === 'triple'
              ? SC_FILL_TRIPLE_DK
              : 'transparent';
    const darkTone = variant === 'bogey' ? SC_FILL_BOGEY_DK : darkFill;
    const darkNumeral =
      colourOverride ??
      (variant === 'empty'
        ? emptyInk
        : variant === 'par'
          ? parInk
          : variant === 'eagle' || variant === 'alba'
            ? '#15171F'
            : INK);
    const ringStep = STROKE + RING_GAP;
    const markInset = ringCount * ringStep;

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
        {Array.from({ length: ringCount }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            data-score-ring={i + 1}
            style={{
              position: 'absolute',
              inset: i * ringStep,
              borderRadius: shape,
              border: `${STROKE}px solid ${darkTone}`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {variant === 'bogey' && (
          <span
            aria-hidden="true"
            data-score-outline="bogey"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 0,
              border: `${STROKE}px solid ${SC_FILL_BOGEY_DK}`,
              pointerEvents: 'none',
            }}
          />
        )}
        {hasMark && variant !== 'bogey' && (
          <span
            aria-hidden="true"
            data-score-fill={variant}
            style={{
              position: 'absolute',
              inset: markInset,
              borderRadius: shape,
              background: darkFill,
              pointerEvents: 'none',
            }}
          />
        )}
        {showStroke && (
          <span
            style={{
              position: 'relative',
              fontSize: Math.round(size * 0.42),
              fontWeight: numWeight,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"zero" 0',
              color: darkNumeral,
            }}
          >
            {numeral}
          </span>
        )}
      </span>
    );
  }

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
      {magnitudeRing && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `${STROKE}px solid ${ringTone}`,
            pointerEvents: 'none',
          }}
        />
      )}
      {hasMark && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: DISC_INSET,
            borderRadius: '50%',
            background: fill,
            pointerEvents: 'none',
          }}
        />
      )}
      {showStroke && (
        <span
          style={{
            position: 'relative',
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
