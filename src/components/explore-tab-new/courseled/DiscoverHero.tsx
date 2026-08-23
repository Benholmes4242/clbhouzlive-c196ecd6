import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { animate, useReducedMotion } from 'framer-motion';

import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import {
  COURSE_GRADIENT,
  COURSE_SCRIMS,
  HERO_TOP_SCRIM,
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

import { relativeDay } from './discoverWhen';
import { A, NUMF, SANS } from './tokens';
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
 * THE SCRIM STACK IS THE TILE'S, SCALED (§1.2). Same layers in the same order —
 * COURSE_GRADIENT base, image, COURSE_SCRIMS, bottom scrim, HERO_TOP_SCRIM — at
 * the tour's proportions (28% top, 90.9% bottom) re-derived against THIS height.
 */

/** Full-bleed and tall enough to be the page's opening, not a banner. */
const HERO_H = 372;
const TOP_SCRIM_H = Math.round(HERO_H * 0.28); // 104
const BOTTOM_SCRIM_H = Math.round(HERO_H * 0.909); // 338

/**
 * THE TOUR'S FIRST THREE STOPS EXACTLY, and a final stop on THE COLOUR OF THE
 * BAND BELOW — which is the page canvas. That is PhotoBand's own rule (end on
 * what comes next so the seam is invisible and the gradient's sand base cannot
 * cast through); the round tile ends on full black because ITS next band is the
 * dark well. Same principle, different neighbour. A.CANVAS is an existing token.
 */
const HERO_BOTTOM_SCRIM = `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, ${A.CANVAS} 100%)`;

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
  const figure = moment.figure ?? 0;
  /* §1.3 — SCORE takes the to-par grammar, QUANTITY and IDENTITY stay white. */
  const figureColor = isScore ? getScoreColor(figure, 'dark', 'standard') : '#FFFFFF';

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
        height: HERO_H,
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
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: COURSE_SCRIMS, zIndex: -1 }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: BOTTOM_SCRIM_H,
          background: HERO_BOTTOM_SCRIM,
          zIndex: -1,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: TOP_SCRIM_H,
          background: HERO_TOP_SCRIM,
          zIndex: -1,
        }}
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
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 70px) 14px 0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.78)',
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
              fontSize: 10,
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
                    : 'rgba(255,255,255,0.78)',
            }}
          >
            {label}
          </div>
        )}

        {/* THE LARGEST NUMERAL IN THE APP (§1.2). The noun keeps its placement
            from the ONE translatable template — before an IDENTITY, after a
            QUANTITY — so a translator can still reorder. */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}>
          {parts.before && <span style={heroWordStyle}>{parts.before}</span>}
          <CountUpFigure
            value={figure}
            format={isScore ? fmtRel : (n) => String(n)}
            style={{
              ...NUMF,
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.06em',
              color: figureColor,
            }}
          />
          {parts.after && <span style={heroWordStyle}>{parts.after}</span>}
        </div>

        <div
          style={{
            marginTop: 9,
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.35,
            color: 'rgba(255,255,255,0.82)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {sentence}
        </div>

        {/* THE MEMBER, THEIR AVATAR AND THE COURSE (§1.2). Amber marks the
            viewing member and nothing else — the same rule as the round tile. */}
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
              color: row.is_self ? '#F7931E' : 'rgba(255,255,255,0.94)',
              flexShrink: 0,
              maxWidth: '45%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.display_name}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.2,
              color: 'rgba(255,255,255,0.78)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {courseName ?? row.course_name ?? t('discover.golfThisWeek.unknownCourse', 'A course')}
            {region ? ` \u00B7 ${region}` : ''}
          </span>
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
  color: 'rgba(255,255,255,0.78)',
};

export default DiscoverHero;
