import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';

/** ~1.2s: long enough to register, short enough not to be a state (§S3.4). */
const CONFIRM_MS = 1200;


import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { CHIP_GLASS_CLASS, SCRIM_STANDOUT } from '@/styles/photoScrim';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import {
  toParFor,
  buildInsightMap,
  referenceLine,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
  INSIGHT_LINE_RESERVE,
  INSIGHT_CLAMP,
  InsightGlyph,
  IndexMovementTriangle,
} from '../friendRoundParts';
import { FIGS } from '@/features/courses/components/holes/analytical/tokens';

import { CourseImageFallback } from './CourseImageFallback';
import { relativeDay } from './discoverWhen';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useRoundHoleShapes, type HoleShape } from './hooks/useRoundHoleShapes';
import { useFollowingIdSet } from './hooks/useFollowingIdSet';
import {
  DEFAULT_WEEK_SCOPE,
  GOLF_WEEK_RAIL_CAP,
  bestOfWeek,
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  useWeekCounts,
  useWeekScopeCourses,
  type WeekScope,
} from './hooks/useGolfThisWeek';
import { useWeekRegionCounts, type RegionSelection } from './hooks/useWeekRegionCounts';
import { RegionDropdown, WeekScopePills, scopeEmptyKey } from './WeekFilters';
import { MiniScorecard, RoundShape } from './RoundShape';
import { GolfThisWeekRail as GolfThisWeekShell } from './DiscoverCourseLedSkeleton';
import { A, CARD_SHELL, GOLD, InkAction, KICKER, LABEL, NUMF, SANS } from './tokens';

/**
 * GOLF THIS WEEK (BRIEF_GOLF_THIS_WEEK). Replaces Around the world (standout
 * feats) and Personal bests, both deleted.
 *
 * EVERY ROUND GETS A CARD. There is no feat threshold anywhere in this file:
 * the interest comes from the COURSE (the variable — a member following four
 * people cannot tell the golfers apart, but Royal Birkdale, Broadstone and
 * Quinta do Lago is plainly a varied week), from the relative band at the top,
 * and from the handicap movement every counting round produces.
 *
 * THIS SECTION ASKS "WHERE". The friends rail above asks "WHO" and is untouched.
 *
 * DECORATION RULES:
 *   - The section heading carries the same outline Lucide icon as the other
 *     Discover sections (CalendarDays) — part of a system, no emoji there.
 *   - The band tiles are small celebratory stat tiles; a single emoji marker
 *     before the label is allowed there, like the trophy on the WON chip.
 *   - The only coloured bitmap is the ace/albatross gold marker on a round card.
 *   - Chevrons appear on navigation only.
 */


/* =============================================================================
   THE TILE'S GEOMETRY AND ITS INK (BRIEF_ROUND_TILE_LIGHT_REFINEMENT).

   WHY THE OLD TILE LOOKED FUSSY, AND IT WAS NOT THE CONTENT: it carried FOUR
   outline systems — card border, chart panel border, marker borders, row
   hairlines — and the chart panel was #F7F9FA on #FFFFFF, a two percent tone
   difference propped up by a 1px border because the tone could not carry the
   separation alone. On dark, separation is free. On light it has to come from
   TONE, and reaching for borders instead is also why the tile was TALL: much of
   the height was padding compensating for weak separation.

   SO: ONE tinted well holds the trajectory AND the scorecard, with no border and
   exactly one hairline inside it; the card drops its border for a shadow. */

const CARD_W = 256;

/* 92 -> 76 (§S4.1). It is a tile whose content is data; 76 is still a
   photograph. */
const PHOTO_H = 76;

/* SHAPE_H 40 — the trajectory is the SUMMARY (BRIEF_ROUND_TILE_MINI_SCORECARD
   §S2.2); the hole grid beneath it carries the detail 60px used to have to. */
const SHAPE_H = 40;

/* THE WELL (§S1). Tint far enough from the #FFFFFF card that the tone separates
   it and an outline is REDUNDANT — the border is DELETED, not softened. */
const WELL = '#EEF2F5';
const WELL_RADIUS = 12;
const WELL_PAD_TOP = 8;
/* 6, not the reference's 10 — see WELL_INNER. */
const WELL_PAD_X = 6;
const WELL_PAD_BOTTOM = 10;
/* THE ONE RULE INSIDE THE WELL, full-bleed to its edges by negative margin. */
const WELL_RULE = 'rgba(11,15,20,0.07)';

/* THE WELL BLEEDS TO THE CARD EDGES, so its inner width is 244px — the width the
   marker/gap measurement table in RoundShape is measured at. That table is the
   binding constraint on the scorecard, so the x padding is 6 rather than the
   reference's 10: at 10 the inner width falls to 236 and a leading double box
   sits 2.7px from the well edge, which is precisely the clipping fault §S3
   exists to fix. Everything else in §S1.3 is as written. */
const WELL_INNER = CARD_W - WELL_PAD_X * 2;

/* THE INK DOES THE HIERARCHY (§S2). One genuinely dark ink and three greys that
   are clearly different from each other, replacing four middling greys. A
   DARKER INK ON FEWER ELEMENTS reads sharper than four greys everywhere. */
const INK = '#0B0F14';   // scores, totals, the insight line's figures
const MID = '#5A6673';   // secondary text
const FAINT = '#9AA5B1'; // eyebrows, labels
const GHOST = '#C8D0D8'; // hole numbers, the level-par grade

/* The card sits on the page rather than being drawn onto it (§S1.5). */
const CARD_SHADOW = '0 1px 2px rgba(11,15,20,0.05)';

/**
 * TILE HEIGHT FLOOR. Measured in the browser on a tile with the full grid:
 * photograph 76, member row, the well (40px trajectory + hairline + two nines of
 * 17px markers with their headers), insight line, padding. Holds the rail level
 * when a round has no hole data and therefore prints no grid at all.
 */
const CARD_MIN_H = 292;



/** The rail scrim of record — imported, never retyped. */
const CARD_SCRIM = SCRIM_STANDOUT;

/** Amber is the viewing member, on their own card border and nowhere else (§7). */
const AMBER = '#F7931E';

/** ON-DARK TONES FOR THE GLASS CHIP (§S2.4, §S2.5) — the light-surface
 *  under-par red and the body index pair both fail over a photograph. */
const GLASS_UNDER = '#FF8A80';
const INDEX_DARK_FELL = '#7BE8A6';
const INDEX_DARK_ROSE = '#FF8A7A';


/**
 * §6.1 — the shape draws itself once on arrival, ~600ms, the round replaying.
 * ONE easing, taken from the existing draw animations in this feature family
 * rather than a third curve, and expressed as a clip-path sweep so nothing about
 * RoundShape's geometry changes.
 */
const DRAW_MS = 600;
const DRAW_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

function ShapeReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [drawn, setDrawn] = useState(false);
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // NOT FOR CARDS OFF SCREEN (§6.1): a rail is horizontally scrolled, so the
    // eighth card must animate when it is reached, not while it is out of view.
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    /* A CURVE MUST NEVER BE PERMANENTLY INVISIBLE. If the observer is starved
       for any reason (clipping, containment, a rail measured at zero), the
       shape reveals itself anyway. */
    const failsafe = window.setTimeout(() => setDrawn(true), 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [reduced]);


  const complete = reduced || drawn;
  /* THE OBSERVED ELEMENT MUST NOT BE THE CLIPPED ELEMENT. A self-clipped node
     (inset(0 100% 0 0)) reports a zero-area intersection rect in Chrome, so the
     observer never fires and the curve stays hidden forever — the defect this
     splits apart. Outer node = measured, inner node = clipped. */
  return (
    <div ref={ref}>
      <div
        style={{
          clipPath: complete ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: reduced ? undefined : `clip-path ${DRAW_MS}ms ${DRAW_EASE}`,
        }}
      >
        {children}
      </div>
    </div>
  );

}

/**
 * §S3 — THREE STATES, ONE OF THEM EMPTY:
 *
 *   not followed   FOLLOW            ink pill
 *   just tapped    FOLLOWING + tick  ~1.2s, then removed
 *   followed       NOTHING AT ALL    no pill, no placeholder, no gap
 *
 * THIS OVERTURNS THE PERSISTENT "FOLLOWING" PILL specified in
 * BRIEF_GOLF_THIS_WEEK_FOLLOW:
 *   "A persistent FOLLOWING pill is a LABEL PRETENDING TO BE A CONTROL. On
 *    Your Circle it appeared on every tile, saying what the pill row had
 *    already said. The button now exists only where there is something to do."
 *
 * THERE IS NO WAY TO UNFOLLOW FROM THIS SURFACE, and that is deliberate. The
 * profile page owns unfollowing — a rail tile is a glance, not an account
 * control, and an accidental unfollow here would be silent and unrecoverable.
 *
 * IT HOLDS NO FOLLOW STATE: the truth is the cached following-id set, so
 * optimism survives a remount and every tile for the same member flips
 * together. The only local state is the ~1.2s confirmation, which is a
 * transient acknowledgement of THIS tap and nothing more.
 */
function FollowButton({
  targetUserId,
  isFollowed,
  viewerUserId,
  align,
}: {
  targetUserId: string;
  isFollowed: boolean;
  viewerUserId: string | undefined;
  /** Where the control sits on the score row when it renders at all. */
  align: 'auto' | 'gap';
}) {
  const { t } = useTranslation('courses');
  const queryClient = useQueryClient();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  /* THE CONFIRMATION (§S3.4). Not decoration: without it the button vanishes on
     tap with no acknowledgement, which reads as a mis-tap. */
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );


  /* THE VIEWER IS THE AUTH USER ID, not a field on the actor. ActiveActor has
     no `userId` — reading it always yielded undefined and useToggleFollow threw
     "missing viewer identity". This is the Clubhouse derivation verbatim
     (FriendsEmptyState): actor id for the ACTOR, auth id for the USER. */
  const viewerActorType = activeActor?.type === 'business' ? 'business' : 'personal';
  const viewerActorId = activeActor?.id ?? viewerUserId;

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (toggle.isPending || confirming) return;
      if (!viewerUserId || !viewerActorId) return;

      const key = ['courseled', 'following-ids', viewerUserId] as const;
      const previous = queryClient.getQueryData<Set<string>>(key);
      /* OPTIMISM LIVES IN THE CACHE, not in a local flag. A new Set, so the
         query's referential identity changes and every reader re-renders. */
      queryClient.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old ?? []);
        next.add(targetUserId);
        return next;
      });
      setConfirming(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);

      /* THE VIEWER-IDENTITY FIX (MICRO_BRIEF_FOLLOW_VIEWER_IDENTITY) IS PASSED
         THROUGH UNCHANGED — do not re-derive these arguments here. */
      toggle.mutate(
        {
          targetActorType: 'personal',
          targetActorId: targetUserId,
          targetUserId,
          viewerActorType,
          viewerActorId,
          viewerUserId,
          isFollowing: false,
        },
        {
          /* ROLL BACK to exactly what was there before the tap, DROP the
             confirmation, and SAY SO — a failed follow must return to FOLLOW
             (§S3.6), never to nothing. */
          onError: () => {
            if (timer.current) clearTimeout(timer.current);
            setConfirming(false);
            if (previous) queryClient.setQueryData<Set<string>>(key, new Set(previous));
            else void queryClient.invalidateQueries({ queryKey: ['courseled', 'following-ids'] });
            toast.error('Could not update follow status. Please try again.');
          },
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['courseled', 'following-ids'] });
          },
        },
      );
    },
    [
      confirming,
      queryClient,
      targetUserId,
      toggle,
      viewerActorId,
      viewerActorType,
      viewerUserId,
    ],
  );

  /* THE FOLLOWED STATE RENDERS NOTHING AND RESERVES NOTHING (§S3.3) — no
     wrapper, no placeholder, no gap. The member name takes the freed width. */
  if (isFollowed && !confirming) return null;

  const wrapper: React.CSSProperties = {
    marginLeft: align === 'gap' ? 8 : 'auto',
    flexShrink: 0,
    display: 'inline-flex',
  };

  if (confirming) {
    /* NOT A BUTTON (§S3.5): the action is done and there is nothing left to
       press, so this is a static span with no handler and no role. */
    return (
      <span style={wrapper}>
        <span
          aria-live="polite"
          style={{
            ...LABEL,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: SANS,
            color: A.MUTE,
            border: `1px solid ${A.BORDER}`,
            borderRadius: 999,
            padding: '5px 10px',
            pointerEvents: 'none',
          }}
        >
          {t('discover.golfThisWeek.following', 'FOLLOWING')}
          <Check size={11} strokeWidth={3} />
        </span>
      </span>
    );
  }

  return (
    <span style={wrapper}>
      <button
        type="button"
        onClick={onClick}
        aria-label="Follow"
        style={{
          ...LABEL,
          flexShrink: 0,
          fontFamily: SANS,
          color: A.PANEL,
          background: A.INK,
          border: `1px solid ${A.INK}`,
          borderRadius: 999,
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        {t('discover.golfThisWeek.follow', 'FOLLOW')}
      </button>
    </span>
  );
}


interface CardProps {
  row: CircleRoundRow;
  shape: HoleShape | null;
  insight: string | null;
  courseName: string | null;
  region: string | null;
  imageUrl: string | null;
  showFollow: boolean;
  /** §2.2 — read from the SAME cached following-id set that drives showFollow. */
  isFollowed: boolean;
  viewerUserId: string | undefined;
  onPress: () => void;
}

/**
 * THE CARD LEADS WITH THE COURSE (§2).
 *
 * Order: course image with the score chip over it / player row / the shape /
 * the strip / the insight line. The gross, to-par and index movement sit in a
 * glass chip ON the photograph — they belong to the round, not to the block,
 * and moving them freed the row beneath for the member. The to-par label that
 * sat on the curve was the same figure twice and collided with an over-par
 * curve's endpoint.
 */

function GolfThisWeekCard({
  row,
  shape,
  insight,
  courseName,
  region,
  imageUrl,
  showFollow,
  isFollowed,
  viewerUserId,
  onPress,
}: CardProps) {
  const { t } = useTranslation('courses');
  const toPar = toParFor(row);
  /* §S2.4 — the sign, from the same two fields toParFor reads. */
  const toParUnder =
    row.gross != null && row.course_par != null && row.gross - row.course_par < 0;
  /* §6.3 — the ONLY marker on this section, and only for these two feats. */
  const legendary = (row.holes_in_one ?? 0) > 0 || (row.albatrosses ?? 0) > 0;
  /* §S2.5 / §S2.6 — THIS round's index movement, on the glass chip. A fall is
     green and a rise is red because a movement's axis is direction of travel;
     the ARROW is what distinguishes it from the to-par figure beside it. Below
     the 0.05 floor there is no movement and no hairline. */
  const delta = row.delta_index;
  const hasMovement =
    delta != null && Number.isFinite(delta) && Math.abs(delta as number) >= 0.05;


  return (
    /* NOT A <button> (§S1.1): FollowButton is a real button and a button inside
       a button is invalid HTML — WebKit commonly never delivers the inner tap.
       Div + role="button" + Enter/Space keeps the whole tile operable. */
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
        ...CARD_SHELL,
        /* THE CARD LOSES ITS BORDER AND TAKES A SHADOW (§S1.5). */
        border: 'none',
        boxShadow: CARD_SHADOW,
        width: CARD_W,
        /* §S4.5 / ACCEPTANCE K vs G — the brief asks BOTH for no reserved height
           when there is no hole data AND for a uniform rail. Those cannot both
           hold per element, so the reserve lives on the CARD: a no-grid tile
           renders no grid and no gap, and the card's minHeight keeps the rail
           level. CARD_MIN_H is the measured height of a tile WITH the grid. */
        minHeight: CARD_MIN_H,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
      }}

    >
      <CourseImageFallback
        courseId={row.course_id}
        courseName={courseName ?? row.course_name}
        imageUrl={imageUrl}
        style={{ height: PHOTO_H, flexShrink: 0 }}
      >
        <div style={{ position: 'absolute', inset: 0, background: CARD_SCRIM }} />
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8 }}>
          <div
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              fontSize: 14,
              fontWeight: 700,
              /* 1.1 / 1, not 1.2 / normal (§S3.6): a two-line name grows
                 UPWARD from bottom 8 and the tightened leading is what keeps its
                 first line clear of the score chip's 37px bottom edge. */
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: '#FFFFFF',
            }}
          >
            {courseName ?? row.course_name ?? t('discover.golfThisWeek.unknownCourse', 'A course')}
          </div>
          <div
            style={{
              marginTop: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10.5,
              lineHeight: 1,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.82)',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {region ?? ''}
            </span>
            <span style={{ opacity: 0.7 }}>{relativeDay(row.play_date, t)}</span>
          </div>
        </div>

        {/* THE SCORE CHIP ON THE PHOTOGRAPH (§S2). .standout-figure-chip carries
            the fill, the border and the @supports blur — the flat fill is the
            base so the chip stays legible with backdrop-filter disabled. NO
            inline background here, ever. */}
        <span
          className={CHIP_GLASS_CLASS}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            borderRadius: 10,
            padding: '5px 10px',
          }}
        >
          <span
            style={{
              ...NUMF,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 0.85,
              color: '#FFFFFF',
            }}
          >
            {row.gross ?? '\u2014'}
          </span>
          {toPar && (
            <span
              style={{
                ...NUMF,
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1,
                /* §S2.4 — the light-surface under-par red dies on a photograph. */
                color: toParUnder ? GLASS_UNDER : 'rgba(255,255,255,0.92)',
              }}
            >
              {toPar.text}
            </span>
          )}
          {/* §S2.6 — NO MOVEMENT, NO HAIRLINE: a divider with nothing after it
              reads as a truncation. */}
          {hasMovement && (
            <>
              <span
                style={{
                  width: 1,
                  alignSelf: 'stretch',
                  background: 'rgba(255,255,255,0.28)',
                  marginLeft: 2,
                  marginRight: 2,
                }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
                {/* Arrow = direction, colour = good or bad, figure ABSOLUTE. */}
                <IndexMovementTriangle
                  direction={(delta as number) < 0 ? 'down' : 'up'}
                  color={(delta as number) < 0 ? INDEX_DARK_FELL : INDEX_DARK_ROSE}
                  size={7}
                />
                <span
                  style={{
                    ...NUMF,
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: (delta as number) < 0 ? INDEX_DARK_FELL : INDEX_DARK_ROSE,
                  }}
                >
                  {Math.abs(delta as number).toFixed(1)}
                </span>
              </span>
            </>
          )}
        </span>
      </CourseImageFallback>


      <div style={{ padding: '9px 11px 9px' }}>
        {/* THE MEMBER ROW SITS DIRECTLY UNDER THE PHOTOGRAPH (§S3.1): the score
            moved onto the image, so the name gets the room. The follow control
            stays right-aligned here in whichever of its three states applies. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            minWidth: 0,
          }}
        >
          {/* THE AVATAR IS THE FRIENDS RAIL'S AVATAR: 20px, no ring (§7). */}
          <SquircleAvatar
            src={row.profile_photo_url}
            userId={row.user_id}
            alt={row.display_name}
            size={20}
            hideRing
          />

          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              fontWeight: 600,
              color: row.is_self ? AMBER : A.BODY,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.display_name}
          </span>

          {legendary && (
            <span style={{ ...LABEL, color: GOLD, flexShrink: 0 }}>
              {(row.holes_in_one ?? 0) > 0
                ? t('discover.golfThisWeek.ace', 'ACE')
                : t('discover.golfThisWeek.albatross', 'ALBATROSS')}
            </span>
          )}

          {showFollow && (
            <FollowButton
              targetUserId={row.user_id}
              isFollowed={isFollowed}
              viewerUserId={viewerUserId}
              align="gap"
            />
          )}
        </div>


        {/* THE TRAJECTORY IS NOW THE SUMMARY (§S2.2): 40px tall, 1.6px stroke,
            full bleed. It no longer has to carry both the shape and the detail —
            the grid beneath is the detail — so it does not take the height it
            took when it was the only record of the round. Everything else about
            the curve is unchanged: graded stroke, solid opaque fill, tangent
            cubic, natural axis, gold-only beads.
            showMeta FALSE: the birdie/par/bogey/double strip is DELETED (§S3.1) —
            the grid says what it said, hole by hole rather than as four totals. */}
        <div style={{ marginTop: 6, marginLeft: -11, marginRight: -11 }}>
          <ShapeReveal>
            <RoundShape
              row={row}
              shape={shape}
              width={CARD_W}
              height={SHAPE_H}
              showMeta={false}
              strokeWidth={1.6}
            />
          </ShapeReveal>
        </div>

        {/* THE SCORECARD — two rows of nine (§S2.4). A round with no hole data
            renders NOTHING here, not a placeholder and not reserved height. */}
        <div style={{ marginTop: 7, marginLeft: -9, marginRight: -9 }}>
          <MiniScorecard shape={shape} />
        </div>



        {/* THE SUBLINE IS THE FRIENDS RAIL'S SUBLINE (§4.2): same glyph, same
            figure font, same body ink, ONE line of reserved height. Aligned to
            the bottom of the reserve so the gap lives above the line, not below
            it, and every tile's line sits at the same height. */}
        <div
          style={{
            minHeight: INSIGHT_LINE_RESERVE,
            /* §S3 — 10px above the insight line, matching the trajectory→grid gap
               above. The grid reads as a block, the line as a comment on it. The
               whole-block margin means a card with NO grid (no hole data) keeps
               the same 10px there, so every tile stays level. */
            marginTop: 10,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          {insight && (
            <div
              style={{
                ...FIGS,
                fontSize: INSIGHT_FONT_SIZE,
                lineHeight: INSIGHT_LINE_HEIGHT,
                fontWeight: 600,
                color: A.BODY,
                ...INSIGHT_CLAMP,
              }}
            >
              <span style={{ display: 'inline' }}>
                <InsightGlyph />
                {insight}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  userId: string | undefined;
  /** THE ONE ROUNDS SECTION (§S1): scope and region are owned above, so the
   *  see-all sheet inherits exactly what the rail is showing. */
  scope?: WeekScope;
  onScopeChange?: (s: WeekScope) => void;
  region?: RegionSelection | null;
  onRegionChange?: (sel: RegionSelection | null) => void;
  onCardPress: (r: CircleRoundRow) => void;
  onSeeAll: () => void;
  style?: React.CSSProperties;
}

export function GolfThisWeek({
  userId,
  scope = DEFAULT_WEEK_SCOPE,
  onScopeChange,
  region = null,
  onRegionChange,
  onCardPress,
  onSeeAll,
  style,
}: Props) {
  const { t } = useTranslation('courses');
  /* THE SCOPE FILTERS AT THE QUERY (§E): Top 100 and Played resolve to a course
     allow-list that goes into SQL. `undefined` means not yet resolved. */
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = roundsQuery.data ?? [];

  const courseIds = useMemo(
    () => all.map((r) => r.course_id).filter((v): v is string => !!v),
    [all],
  );
  const played = usePlayedCourseIds(userId);
  const playedSet = useMemo(() => new Set(played.ids), [played.ids]);
  const following = useFollowingIdSet(userId);

  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  /* COUNTS RESPECT THE ACTIVE PILL (§S3.6): the region list is grouped from the
     rounds THIS scope returned, and needs no query of its own (§S3.7). */
  const regions = useWeekRegionCounts(all, meta);
  const inRegion = useMemo(
    () => all.filter((r) => regions.matches(r, region)),
    [all, regions, region],
  );

  const ordered = useMemo(() => orderForWeek(inRegion, playedSet), [inRegion, playedSet]);
  const counts = useWeekCounts(ordered);
  const best = useMemo(() => bestOfWeek(ordered), [ordered]);
  const rows = useMemo(() => ordered.slice(0, GOLF_WEEK_RAIL_CAP), [ordered]);

  /* ONE batched hole-shape read for the whole rail — never one per card. */
  const scoreIds = useMemo(() => rows.map((r) => r.score_id), [rows]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  /* §4.2 — the insight map is resolved for the WHOLE rail so buildInsightMap's
     repetition cap can see its neighbours. Never per card. */
  const insights = useMemo(() => buildInsightMap(rows, t as never), [rows, t]);

  const pending = !!userId && (roundsQuery.isPending || !scopeCourses.ready);
  if (pending) return <GolfThisWeekShell />;

  const bestToPar = best == null ? null : best.toPar === 0
    ? 'E'
    : best.toPar < 0
      ? `\u2212${Math.abs(best.toPar)}`
      : `+${best.toPar}`;
  const courseNameFor = (r: CircleRoundRow) =>
    meta?.get(r.course_id ?? '')?.name ?? r.course_name ?? '';

  /* THE BAND IS FOUR COMPARISONS OF EQUAL WEIGHT (§2) — tiles, not a sentence
      with footnotes. Each is self-contained: label, figure, who, where.

      BIGGEST MOVE WAS DELETED (reducer and tile) because it returned the same
      round as MOST IMPROVED whenever the largest absolute delta_index was a cut,
      which is roughly half of all weeks. "Biggest rise" would always be distinct
      but would put a member's worst week on Discover.

      BEST STABLEFORD is the reason the band is worth a data change: gross is won
      by the same two or three low handicappers every week, Stableford is NET, so
      the whole membership can enter. It is not `net` — net is ruined by one
      blow-up hole, Stableford charges that hole and nothing more.

      TIES GO TO THE MOST RECENT ROUND in every tile: `ordered` is lens-ordered,
      not date-ordered, so recency is compared explicitly rather than relying on
      a reducer keeping its first-seen row.

      All four tiles carry a marker. They are four comparisons of EQUAL WEIGHT,
      so marking some and not others reads as an omission rather than as emphasis.
      A SECTION HEADING glyph is part of a system — outline lucide icons in ink
      across every Discover section — and an emoji there would be the only
      coloured bitmap among them. */

  /* Each tile is strictly the top of its own category. One member CAN hold
     several — a good round is low gross, high Stableford and birdie-rich at
     once. Deduping by member was rejected: showing second place in a tile
     labelled 'best' is a bug to the member who actually holds it. */
  const newer = (a: CircleRoundRow, b: CircleRoundRow) =>
    String(a.play_date).localeCompare(String(b.play_date)) > 0;

  const withDelta = ordered.filter(
    (r) => r.delta_index != null && Number.isFinite(r.delta_index),
  );
  const mostImproved = withDelta.reduce<CircleRoundRow | null>((acc, r) => {
    const d = r.delta_index as number;
    if (d >= 0) return acc;
    if (!acc) return r;
    const cur = acc.delta_index as number;
    if (d < cur) return r;
    if (d === cur && newer(r, acc)) return r;
    return acc;
  }, null);

  /* NULL STABLEFORD FAILS THE FILTER, never contributes a 0 (§1.3). FLOOR 36 —
     the par-equivalent every club golfer knows. */
  const bestStableford = ordered.reduce<CircleRoundRow | null>((acc, r) => {
    const p = r.stableford_points;
    if (p == null || !Number.isFinite(p) || p < 36) return acc;
    if (!acc) return r;
    const cur = acc.stableford_points as number;
    if (p > cur) return r;
    if (p === cur && newer(r, acc)) return r;
    return acc;
  }, null);

  /* FLOOR 3 — "1 birdie" is not a comparison, and a two-way tie on 1 is worse. */
  const mostBirdies = ordered.reduce<CircleRoundRow | null>((acc, r) => {
    const b = r.birdies;
    if (b == null || !Number.isFinite(b) || b < 3) return acc;
    if (!acc) return r;
    const cur = acc.birdies as number;
    if (b > cur) return r;
    if (b === cur && newer(r, acc)) return r;
    return acc;
  }, null);

  const bandTiles: {
    key: string;
    emoji?: string;
    label: string;
    figure: string;
    tone: string;
    row: CircleRoundRow;
    sub: string;
  }[] = [];

  if (best) {
    bandTiles.push({
      key: 'best',
      emoji: '\uD83D\uDD25', // FIRE
      label: t('discover.golfThisWeek.bestLabel', 'BEST THIS WEEK'),
      figure: String(best.row.gross ?? '\u2014'),
      tone: best.toPar < 0 ? TOPAR_RED : A.INK,
      row: best.row,
      sub: `${bestToPar ?? ''} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(best.row)}`.trim(),
    });
  }
  if (bestStableford) {
    bandTiles.push({
      key: 'stableford',
      emoji: '\uD83C\uDFAF', // DIRECT HIT / DART BOARD
      label: t('discover.golfThisWeek.stablefordLabel', 'Best stableford'),
      figure: String(bestStableford.stableford_points),
      tone: A.INK,
      row: bestStableford,
      sub: `${t('discover.golfThisWeek.stablefordUnit', 'points')} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(bestStableford)}`,
    });
  }
  if (mostBirdies) {
    bandTiles.push({
      key: 'birdies',
      emoji: '\uD83D\uDC26', // BIRD
      label: t('discover.golfThisWeek.birdiesLabel', 'Most birdies'),
      figure: String(mostBirdies.birdies),
      tone: A.INK,
      row: mostBirdies,
      sub: `${t('discover.friendsRail.birdies', 'birdies')} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(mostBirdies)}`,
    });
  }
  if (mostImproved) {
    const d = mostImproved.delta_index as number;
    bandTiles.push({
      key: 'improved',
      emoji: '\uD83D\uDCAA', // FLEXED ARM
      label: t('discover.golfThisWeek.improvedLabel', 'MOST IMPROVED'),
      figure: `\u2212${Math.abs(d).toFixed(1)}`,
      tone: A.IMPROVED,
      row: mostImproved,
      sub: `${t('discover.friendsRail.index', 'HCP')} ${t('discover.golfThisWeek.at', 'at')} ${courseNameFor(mostImproved)}`,
    });
  }



  return (
    <section style={style}>
      {/* No heading. This section leads the page, directly under the chrome
          island, and its pills state its scope more clearly than a title would.
          Every section below it keeps the glyph-and-heading treatment — that rule
          is intact, this is the one exception and it is because it is first. */}

      {/* THE FILTER'S READOUT ROW. The count and the region control are the
          section's top edge; without them the pills would sit bare under the
          chrome island. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          /* The floating header sits at sat + 10 and is 44px tall, so sat + 70
             gives 16px of clearance everywhere. */
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 70px)',
          marginBottom: 12,
          minWidth: 0,
        }}
      >
        {/* Not a label - the filter's readout. It is the only thing on screen
            that responds when a pill or a region changes, so it must always
            describe what is CURRENTLY rendered. */}
        <span
          className="tabular-nums"
          style={{ ...KICKER, color: A.MUTE, flex: '0 0 auto' }}
        >
          {t('discover.golfThisWeek.count', '{{rounds}} rounds \u00B7 {{courses}} courses', {
            rounds: counts.rounds,
            courses: counts.courses,
          })}
        </span>
        <RegionDropdown
          regions={regions}
          selection={region}
          onChange={(sel) => onRegionChange?.(sel)}
        />
      </div>

      {/* SCOPE PILLS — one row beneath the readout. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          minWidth: 0,
        }}
      >
        <WeekScopePills
          scope={scope}
          onChange={(s) => onScopeChange?.(s)}
          style={{ flex: '1 1 auto', minWidth: 0 }}
        />
      </div>

      {/* AN HONEST EMPTY ANSWER (§S2.5): the filters stay, the sentence explains. */}
      {rows.length === 0 && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: A.MUTE,
            fontFamily: SANS,
            padding: '10px 0 4px',
          }}
        >
          {t(scopeEmptyKey(scope).key, scopeEmptyKey(scope).fallback)}
        </div>
      )}

      {bandTiles.length > 0 && (
        <div
          className="scrollbar-hide"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginBottom: 12,
          }}
        >
          {bandTiles.map((tile) => (
            <div
              key={tile.key}
              style={{
                ...CARD_SHELL,
                /* FOUR TILES DO NOT SHRINK (§3.1): the figure is the content, so
                   the band scrolls at 320px instead. With one, two or three the
                   basis grows and the row fills the width. */
                flex: '1 0 148px',
                minWidth: 148,
                padding: '9px 10px 10px',
                fontFamily: SANS,
              }}
            >
              <div
                style={{
                  ...LABEL,
                  color: A.MUTE,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ lineHeight: 1 }}>{tile.emoji}</span>
                {tile.label}
              </div>

              <div
                style={{
                  ...NUMF,
                  marginTop: 4,
                  fontSize: 22,
                  lineHeight: 1,
                  color: tile.tone,
                }}
              >
                {tile.figure}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <SquircleAvatar
                  src={tile.row.profile_photo_url}
                  userId={tile.row.user_id}
                  alt={tile.row.display_name}
                  size={20}
                  hideRing
                />
                <span
                  style={{
                    minWidth: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: A.BODY,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tile.row.display_name}
                </span>
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: A.MUTE,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {tile.sub}
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Cards only in the horizontal rail; the See-all action sits below the
          first card in a fixed position and does NOT scroll with the carousel. */}
      <div
        className="scrollbar-hide"
        style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto' }}
      >
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          return (
            <GolfThisWeekCard
              key={r.round_id}
              row={r}
              shape={holeShapes?.get(r.score_id ?? '') ?? null}
              insight={insights.get(r.round_id)?.text ?? referenceLine(r, t)}
              courseName={m?.name ?? r.course_name}
              region={m?.region ?? null}
              imageUrl={m?.imageUrl ?? null}
              /* §2.2 — never on the member's own round, never on someone already
                 followed, and never before the follow set has resolved. */
              showFollow={!r.is_self && !!userId && !!following.data}
              isFollowed={!!following.data?.has(r.user_id)}
              viewerUserId={userId}
              onPress={() => onCardPress(r)}
            />
          );
        })}
      </div>

      {counts.rounds > rows.length && (
        <div style={{ marginTop: 8, width: CARD_W }}>
          <InkAction onClick={onSeeAll}>
            {t('discover.golfThisWeek.seeAll', 'See all {{count}} rounds', {
              count: counts.rounds,
            })}
          </InkAction>
        </div>
      )}

    </section>
  );
}

export default GolfThisWeek;
