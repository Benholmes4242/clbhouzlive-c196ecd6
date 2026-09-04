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
import {
  TOPAR_UNDER_DARK,
  WHITE_ALPHA_18,
} from '@/features/tourhub/_shared/tokens';

/**
 * ScoreMark - the universal scoring-mark renderer.
 *
 * SCORE MARK PILL — one grammar, three independent channels.
 *
 * Commit f9eb4521 (2 Aug 2026) removed the old “World Feed” filled-chip
 * system: red birdie, GOLD eagle, BLUE bogey and NAVY double, with hue carrying
 * magnitude and fills shared across light/dark. CORRECTION_ONE_SCORING_MARK
 * made the outline scorecard grammar universal. This treatment keeps that
 * correction's semantic rule — RED means under par, INK means over par, GOLD
 * means rarity only — while deliberately replacing outlines with fills.
 * Magnitude now has one symmetrical signal: a ring whenever |score - par| >= 2.
 *
 * Fills are explicitly NOT shared across surfaces. Over-par grounds invert
 * from ink-alpha on light to light-alpha on dark, and under-par uses the
 * surface-specific canonical red. The ring gap is transparent, exposing the
 * actual host surface rather than assuming white.
 * Shared across:
 *  - Card scorecard sheet (CardScorecardSheet)
 *  - Handicap personal scorecard
 *  - Course Holes tab legend
 *  - Clubhouse feed round card (surface="dark")
 *
 * Every mark is circular. Solid fill says under; ground says over; bare says
 * par. Ring says two-or-more from par on either side. Ace/albatross remain RED
 * filled with a GOLD rarity ring — never a gold fill.
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
const OVER_INK_DARK = '#F2F4F7';

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
/* DARK-ONLY PART C: bogey and double deliberately share the same legible
   ground. At 17px their ONE distinction is the double's 1.5px magnitude ring;
   that ring can never be softened without reopening this contrast decision. */
const DARK_BOGEY_GROUND = WHITE_ALPHA_18;
const DARK_DOUBLE_GROUND = WHITE_ALPHA_18;

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

  const under = variant === 'birdie' || variant === 'eagle' || variant === 'alba' || variant === 'hio';
  const over = variant === 'bogey' || variant === 'doub' || variant === 'triple';
  const hasMark = under || over;
  const magnitudeRing = variant === 'eagle' || variant === 'alba' || variant === 'hio' || variant === 'doub' || variant === 'triple';
  const goldRing = variant === 'alba' || variant === 'hio';

  const overInk = surface === 'dark' ? OVER_INK_DARK : OVER_INK_LIGHT;
  const parInk = surface === 'dark' ? SC_PAR_DARK : SC_PAR;
  const emptyInk = surface === 'dark' ? 'rgba(242,244,247,0.35)' : '#CBD5E1';
  const underRed = surface === 'dark' ? TOPAR_UNDER_DARK : SC_FILL_BIRDIE;
  const overGround = variant === 'doub' || variant === 'triple'
    ? surface === 'dark' ? DARK_DOUBLE_GROUND : LIGHT_DOUBLE_GROUND
    : surface === 'dark' ? DARK_BOGEY_GROUND : LIGHT_BOGEY_GROUND;
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
