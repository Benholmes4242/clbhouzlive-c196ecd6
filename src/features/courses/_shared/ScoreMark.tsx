import React from 'react';
import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';
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
 * THE DARK GRAMMAR IS THE GRAMMAR (ratified 4 Sep 2026, BRIEF_ROUND_SCORECARD_
 * REBUILD §A). Per outcome: unplayed a faint mid-dot; par a bare numeral;
 * birdie a FILLED red disc; eagle a FILLED gold disc with one ring; albatross or
 * ace a FILLED gold disc with two rings; bogey an OUTLINED ink square; double a
 * FILLED blue square; triple+ a FILLED deep-blue square with one ring. Rings
 * encode degree, gold encodes rarity. Filled is correct — do not "restore
 * outlines"; the outline proposal was considered and is not the shipped grammar.
 *
 * THE LIGHT BRANCH IS ON THE DEAD LIST (see ScoreMark.tsx:225-280). No product
 * surface passes surface="light" any more — RoundCardHoleStrip was the last one
 * and moved to dark in §A. It is retained on disk (nothing is deleted) and is
 * still exercised by ScoreMark.test.tsx; treat it as unreachable, not as an
 * alternative theme, and do not add new callers.
 *
 * Shared across (all dark):
 *  - Card scorecard sheet (CardScorecardSheet)
 *  - Handicap round card strip (RoundCardHoleStrip)
 *  - Clubhouse feed round card (PostRoundCard)
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
            ? INK_ON_LIGHT
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

  /* ---------------------------------------------------------------------------
     DEAD LIST (BRIEF_ROUND_SCORECARD_REBUILD §A) — THE LEGACY LIGHT BRANCH.
     Everything from here to the end of the component is the older light
     outline/tint vocabulary. It has NO product caller as of 10 Sep 2026; the
     last one (RoundCardHoleStrip) moved to the dark grammar in §A. Retained on
     disk deliberately (nothing is deleted) and still covered by
     ScoreMark.test.tsx. Do not add callers, and do not treat it as a theme.
     --------------------------------------------------------------------------- */
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
