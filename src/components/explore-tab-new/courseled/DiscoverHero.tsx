import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { animate, useReducedMotion } from 'framer-motion';

import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { COURSE_GRADIENT } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
import { HERO_CANON_SCRIM } from '@/features/tourhub/_shared/heroGradient';


import { relativeDay } from './discoverWhen';
import { DISCOVER_FACT, DISCOVER_QUIET, NUMF, SANS } from './tokens';
import {
  ROW_DARK_INDEX_FELL,
  ROW_DARK_TOPAR_UNDER,
  fmtRel,
  momentFigureParts,
  momentLabel,
  momentSentence,
  type TFn,
} from './GolfThisWeek';

import type { DiscoverHeroSubject } from './hooks/useDiscoverHero';

/**
 * THE PAGE HERO (BRIEF_DISCOVER_WORLD_CLASS §1).
 *
 * Discover used to open on "6 ROUNDS · 3 COURSES · 7 DAYS" at 9px — a footer, at
 * the top of the page. THE FIRST THING A MEMBER SEES IS NOW THE MOST INTERESTING
 * THING THAT HAPPENED: the week's highest-ranked moment, full-bleed, carrying the
 * LARGEST NUMERAL IN THE APP.
 *
 * WHAT IT IS NOT:
 *   - NOT the lowest gross. That is row 1 of the BEST THIS WEEK chip directly
 *     beneath it (§1.1, ACCEPTANCE b). Its subject is chosen in useDiscoverHero.
 *   - NOT a section. It has no eyebrow, no see-all and no empty state: with every
 *     round PLAIN the parent renders nothing and NO HEIGHT IS RESERVED
 *     (ACCEPTANCE c).
 *   - NOT a control surface. The readout and the scope pills stay beneath it,
 *     inside the rounds section, exactly where they were (§1.5).
 *
 * WHERE THE PAGE SPENDS ITS SATURATION (§0, §1.3). On a dark canvas saturation is
 * a currency, and this is the one element that spends it: a SCORE-role figure
 * takes the dark to-par grammar through getScoreColor — a 56px red −3 at the top
 * of a near-monochrome page. A QUANTITY figure ("5 BIRDIES", "8 IN A ROW") is a
 * COUNT, not a score, and stays white. That is BRIEF_ROUND_TILE_MARK_AND_FIGURE
 * §1 unchanged, at a larger size. NO NEW HUE EXISTS IN THIS FILE.
 *
 * THE SCRIM IS THE CANON, ONE LAYER (MICRO_BRIEF_DISCOVER_HERO_CANON_LAYERING).
 * HERO_CANON_SCRIM over the image, with COURSE_GRADIENT painted beneath as the
 * NO-IMAGE FALLBACK only. No radial ambient, no top scrim, no second bottom
 * scrim, no text shadow — the same single gradient every other photo-led hero
 * runs, ending on A.CANVAS so there is no seam into the readout row.
 *
 * THE RAMP LIVES ONCE, in _shared/heroGradient.ts: 0 -> 0.20 @42% -> 0.62 @74%
 * -> the surface below. That last stop is the rule, not a detail: END ON WHAT
 * COMES NEXT so the seam is invisible and the gradient's sand base cannot cast
 * through. Here the neighbour is the page canvas; the round tile ends on full
 * black because ITS next band is the dark well. Same principle, different
 * neighbour.
 *
 * THE HEIGHT WAS DELIBERATELY HELD AT 372 when the layering was canonicalised
 * (same brief, §0). Nothing composes against Discover's total — no ticker, no
 * height target — so the canon's clamp does not apply here. Do not "finish the
 * job" by swapping it for HERO_MIN_H.
 */

/** Full-bleed and tall enough to be the page's opening, not a banner. */
const HERO_H = 372;


/** §4.1 — ~400ms, ease-out, once. */
const COUNT_MS = 400;

/**
 * THE FIGURE COUNTS UP (§4.1) AND CANNOT REFLOW (§4.4).
 *
 * HOW THE NO-LAYOUT-SHIFT GUARANTEE IS MADE, rather than hoped for: the FINAL
 * string is always in the layout, at zero opacity, and it alone sizes the box.
 * The counting value is painted in an absolutely positioned overlay, so it is out
 * of flow and CANNOT change the line's width at any frame. Tabular lining figures
 * on top of that mean even the intermediate strings are the same advance. The
 * final frame is therefore pixel-identical to the static render (ACCEPTANCE i).
 *
 * ONCE PER MOUNT (§4.4): a ref, not state, and an effect with no dependencies —
 * so a re-render, a scroll-back or a SCOPE-PILL CHANGE (which changes props on the
 * SAME instance, never remounting it) cannot restart it. With reduced motion the
 * effect returns before animating anything and the final value is what renders
 * from the first frame (ACCEPTANCE h).
 */
function CountUpFigure({
  value,
  format,
  style,
}: {
  value: number;
  format: (n: number) => string;
  style: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState<number>(reduced ? value : 0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (reduced) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: COUNT_MS / 1000,
      ease: 'easeOut',
      onUpdate: (v) => setShown(v),
      onComplete: () => setShown(value),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ONCE PER MOUNT (§4.4).
  }, []);

  /* Rounded towards the final value's sign so a count to −3 never prints "0"
     twice or overshoots into "+1". */
  const rounded = value < 0 ? Math.ceil(shown) : Math.floor(shown);

  return (
    <span style={{ ...style, position: 'relative', display: 'inline-block' }}>
      {/* IN FLOW, INVISIBLE, FINAL — this is what sizes the box. */}
      <span aria-hidden style={{ opacity: 0 }}>{format(value)}</span>
      {/* OUT OF FLOW, VISIBLE, COUNTING — cannot affect layout. */}
      <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' }}>
        {format(rounded)}
      </span>
    </span>
  );
}

export function DiscoverHero({
  subject,
  onPress,
}: {
  subject: DiscoverHeroSubject;
  onPress: () => void;
}) {
  const { t } = useTranslation('courses');
  const { row, moment, courseName, region, imageUrl } = subject;

  const label = momentLabel(moment, t as TFn);
  const sentence = momentSentence(moment, t as TFn);
  const parts = momentFigureParts(moment, t as TFn);

  const isScore = moment.figureRole === 'score' && moment.figure != null;
  /* THE HERO RENDERS MOMENTS ONLY (AMENDMENT 1 §2). Plain rounds are filtered out
     of the pool upstream, so there is no plain composition here — deliberately no
     fallback and no dead branch. */
  const isGrossScore = moment.kind === 'courseRecord';
  const figure = moment.figure ?? 0;
  /* The hero figure and its adjacent noun share the course-name white — EXCEPT
     THE RUN, which carries the falling-index green through figure and noun, the
     same rule the round tile's MomentFigure applies. */
  const isRun = moment.kind === 'run';
  const figureColor = isRun
    ? ROW_DARK_INDEX_FELL
    : isGrossScore && (moment.facts.toPar ?? 0) < 0
      ? ROW_DARK_TOPAR_UNDER
      : DISCOVER_FACT;

  const wordStyle: React.CSSProperties = isRun
    ? { ...heroWordStyle, color: ROW_DARK_INDEX_FELL }
    : heroWordStyle;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          onPress();
        }
      }}
      style={{
        position: 'relative',
        /* Match Course Detail's immersive hero contract: escape the centred app
           column, start at physical y=0, and add the notch to the visual height
           rather than taking it out of the 372px composition. */
        width: '100dvw',
        marginLeft: 'calc(50% - 50dvw)',
        height: `calc(${HERO_H}px + env(safe-area-inset-top, 0px))`,
        /* `isolation` makes this a stacking context so the zIndex -1 layers sit
           ABOVE the element's own background and BELOW the in-flow content — the
           same construction the round tile uses. */
        isolation: 'isolate',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: COURSE_GRADIENT,
        fontFamily: SANS,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          /* THE PAGE'S OPENING IMAGE IS NOT LAZY — it is above the fold by
             definition, and lazy-loading it would show the bare gradient first. */
          decoding="async"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 55%',
            zIndex: -1,
          }}
        />
      )}
      {/* THE ONE GRADIENT (MICRO_BRIEF_DISCOVER_HERO_CANON_LAYERING §1-2). */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: HERO_CANON_SCRIM, zIndex: -1 }}
      />


      {/* THE HERO OWNS THE NOTCH AND THE FLOATING CHROME ISLAND: the clearance
          that used to live in the rounds section's first row is paid here, and
          the section drops it (chromeClearance={false}). The day sits top-right,
          the same position it takes on a round tile. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: 'calc(env(safe-area-inset-top, 0px) + 70px) 14px 0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: DISCOVER_QUIET,
          }}
        >
          {relativeDay(row.play_date, t)}
        </span>
      </div>

      {/* THE CONTENT STACK, bottom-aligned: eyebrow, figure, sentence, member. */}
      <div style={{ padding: '0 14px 18px', minWidth: 0 }}>
        {label && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: 8,
              /* THE TILE'S RULE, UNCHANGED: the eyebrow is white-at-alpha, with
                 the two existing exceptions — THE RUN takes the falling-index
                 green, FINISHED IN THE RED takes the under-par red. */
              color:
                moment.kind === 'run'
                  ? ROW_DARK_INDEX_FELL
                  : moment.kind === 'finishedInRed'
                    ? ROW_DARK_TOPAR_UNDER
                    : DISCOVER_QUIET,
            }}
          >
            {label}
          </div>
        )}

        {/* THE LARGEST NUMERAL IN THE APP (§1.2). The noun keeps its placement
            from the ONE translatable template — before an IDENTITY, after a
            QUANTITY — so a translator can still reorder. THE ROW HOLDS THE FIGURE
            AND ITS NOUN AND NOTHING ELSE (BRIEF_DISCOVER_HERO_SCORE_AND_FILTER_ROW
            §1.1): a gross total beside a count of holes put two numerals of
            different KINDS on one line in one colour, and a hero states one claim. */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}>
          {parts.before && <span style={wordStyle}>{parts.before}</span>}
          <CountUpFigure
            value={figure}
            format={isScore && !isGrossScore ? fmtRel : (n) => String(n)}
            style={{
              ...NUMF,
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.06em',
              color: figureColor,
            }}
          />
          {parts.after && <span style={wordStyle}>{parts.after}</span>}
        </div>


        <div
          style={{
            marginTop: 9,
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.35,
            color: DISCOVER_FACT,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {sentence}
        </div>

        {/* WHAT THE ROUND SCORED — a LABELLED TWO-UP (§1.2), the same
            figure-over-label shape the tour surfaces use. TONE: the gross carries
            figureColor, the ACHIEVEMENT's colour. THE QUALIFIER'S COLOUR IS A
            FUNCTION OF WHAT THE MOMENT CLAIMS, NOT OF THE NUMBER'S SIGN (§1.4):
            only when the moment is itself about the score (course record,
            finished in the red) does the to-par carry the achievement colour.
            Everywhere else — the run, birdie haul, strong finish, grind, eagle —
            it is CONTEXT beside the claim and renders in the neutral fact tone.
            Never inverted to red: a red +4 beside a green 9 would read as
            criticism of a good round. BOTH LABELS ARE ALWAYS FAINT.
            ABSENT IS ABSENT: neither value renders NOTHING — no block, no
            marginTop, no reserved height, never a dash. ON A COURSE RECORD the
            56px figure ALREADY IS the gross, so only TO PAR renders. */}
        {(() => {
          const toPar = moment.facts.toPar;
          const showGross = row.gross != null && !isGrossScore;
          const showQual = toPar != null;
          if (!showGross && !showQual) return null;

          const momentIsAboutScore = isGrossScore || moment.kind === 'finishedInRed';
          const cell = (value: string, label: string, color: string) => (
            <div key={label} style={{ minWidth: 0 }}>
              <div
                className="tabular-nums"
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: HERO_FAINT,
                }}
              >
                {label}
              </div>
            </div>
          );

          return (
            <div style={{ display: 'flex', gap: 22, marginTop: 12 }}>
              {showGross &&
                cell(String(row.gross), t('scorecard.gross', 'GROSS'), figureColor)}
              {showQual &&
                cell(
                  fmtRel(toPar as number),
                  t('scorecard.toPar', 'TO PAR'),
                  momentIsAboutScore ? figureColor : DISCOVER_FACT,
                )}
            </div>
          );
        })()}


        {/* THE MEMBER AND THEIR AVATAR ON ROW ONE, THE COURSE ON ROW TWO
            (BRIEF_DISCOVER_ONE_PAGE §1). Sharing one row cost the course most of
            its width, and the first thing to go was the parenthetical — which is
            the ONLY thing separating East from West at the same club. A line
            break, not a restyle: every size, weight and colour is unchanged. */}
        <div
          style={{
            marginTop: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          <SquircleAvatar
            src={row.profile_photo_url}
            userId={row.user_id}
            alt={row.display_name}
            size={24}
            hairlineRing
            ringColor={DARK_HAIRLINE}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.2,
              color: row.is_self ? '#F7931E' : DISCOVER_FACT,
              flexShrink: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.display_name}
          </span>
        </div>

        {/* ROW TWO — the course and its region, ALONE (§1.1). No flex wrapper for
            a single child and nothing to right-align against: the score is a
            labelled two-up above the member row now. The text wraps to a second
            line rather than truncating: a clipped course name is a course the
            member cannot identify. */}

        <div
          style={{
            marginTop: 4,
            minWidth: 0,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.25,
            color: DISCOVER_QUIET,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {courseName ?? row.course_name ?? t('discover.golfThisWeek.unknownCourse', 'A course')}
          {region ? ` \u00B7 ${region}` : ''}
        </div>

      </div>
    </div>
  );
}

const heroWordStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.14em',
  lineHeight: 1,
  textTransform: 'uppercase',
  color: DISCOVER_FACT,
};

export default DiscoverHero;
