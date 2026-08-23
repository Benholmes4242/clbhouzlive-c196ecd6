import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight } from 'lucide-react';


/** ~1.2s: long enough to register, short enough not to be a state (§S3.4). */
const CONFIRM_MS = 1200;


import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { WHITE_ALPHA_04, WHITE_ALPHA_08 } from '@/features/tourhub/_shared/tokens';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { toParFor, IndexMovementTriangle } from '../friendRoundParts';
import {
  COURSE_GRADIENT,
  COURSE_SCRIMS,
  HERO_TOP_SCRIM,
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

import { relativeDay } from './discoverWhen';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useRoundHoleShapes, type HoleShape } from './hooks/useRoundHoleShapes';
import { useFollowingIdSet } from './hooks/useFollowingIdSet';
import {
  DEFAULT_WEEK_SCOPE,
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
import { MiniScorecard } from './RoundShape';
import {
  selectMoment,
  type Moment,
} from './roundMoment';

import { GolfThisWeekRail as GolfThisWeekShell } from './DiscoverCourseLedSkeleton';
import {
  A,
  CARD_RADIUS,
  CARD_SHELL,
  CHIP_RADIUS,
  InkAction,
  KICKER,
  LABEL,
  NUMF,
  SANS,
  WELL_RADIUS,
} from './tokens';


/**
 * GOLF THIS WEEK (BRIEF_GOLF_THIS_WEEK). Replaces Around the world (standout
 * feats) and Personal bests, both deleted.
 *
 * THE HERO'S COLOUR LAW (BRIEF_HERO_TEXT_FLOOR_AND_DELTA §2, correcting
 * BRIEF_ROUND_TILE_HERO_TOUR_COLOUR §0): EVERY VALUE IN THE HERO IS WHITE OR
 * WHITE-AT-ALPHA **EXCEPT WHERE COLOUR CARRIES MEANING** — a to-par score
 * (canonical getScoreColor(delta, 'dark', 'standard'), never a hand-picked hex),
 * an INDEX MOVEMENT (INDEX_DELTA.dark), and the AMBER that marks the viewing
 * member.
 *
 * TEXT ALPHA FLOOR — NOTHING IN THE HERO OR THE MEMBER ROW BELOW 0.72
 * (BRIEF_HERO_TEXT_FLOOR_AND_DELTA §1). Half-transparent white at 9.5px over a
 * photograph is not legible, and raising the scrim further would erase the
 * photograph to fix a type problem. The LADDER survives — course name 0.94 leads,
 * sentence 0.82, everything else 0.78 — do NOT add a hero text value below 0.72.
 *
 * THE THREE DELIBERATE DIVERGENCES FROM THE TOUR HERO (§3). All three exist
 * because the TILE CARRIES SOMETHING THE TOUR DOES NOT:
 *   1. AMBER marks the viewing member — the tour hero has no concept of "you".
 *   2. THE INDEX DELTA IS GREEN/RED (INDEX_DELTA.dark) — the tour hero has no
 *      index movement, so PhotoBand's "colour only on a score" never faced this
 *      case. A falling index is better and is green; a rising one is worse and
 *      is red. That direction rule is correct and must not be "fixed".
 *   3. THE BOTTOM SCRIM'S FINAL STOP REACHES FULL OPACITY rather than
 *      HERO_BOARD_SURFACE — the tile's next band is light, the tour's is dark.

 *
 * WHAT THAT COSTS, ON PURPOSE: the seven moments are now distinguished ONLY BY
 * THEIR WORDS. MOMENT_TONE survives in exactly one place — the tinted band
 * behind marked holes in the WELL. Do NOT reintroduce a coloured eyebrow, a
 * tinted corner, an accent rule, a left border or a per-kind gradient to tell
 * them apart. If the moments need distinguishing again that is Ben's decision,
 * not a forgotten detail.
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
   THE TILE'S GEOMETRY (BRIEF_ROUND_TILE_THE_MOMENT v2).

   THE TILE IS A HERO, A MEMBER ROW AND A SCORECARD WELL: gradient hero 156 /
   member row with the score / a tinted well holding TWO ROWS OF NINE.

   ONE CHART ONLY — THE SCORECARD (§S0.3). The trajectory variant was designed
   and CUT: two chart types meant two heights, two sets of axis rules and a
   selector deciding presentation as well as content. The hero already says what
   to look for, so the card simply shows it.

   THE PHOTOGRAPH IS GONE (§S0.4). PHOTO_H, the scrim and the glass chip tokens
   went with it; the hero gradient carries the top of the card. */

const CARD_W = 256;

/** §S2.1 — the gradient hero. */
const HERO_H = 156;

/* THE GRID REGION. 96px, not 88: at 88 the two marker rows and their outer
   rings did not fit the region and the bottom row's circles and boxes were
   clipped by the card. IT IS FIXED, so every well is the same height even
   when a round has no hole data and the well is empty (§S1.7, ACCEPTANCE K). */
const GRID_H = 100;

/* BRIEF_DARK_ONLY_PART_B §2.2 — THE CLUBHOUSE FEED'S DARK SCORECARD WELL.
   The previous white well was correct only on the retired light canvas. This
   uses the feed round card's existing translucent scorecard-panel treatment;
   marker spacers receive this exact value and moment-band spacers receive its
   computed blend, so neither can halo. */
const WELL = 'rgba(11,13,16,0.66)';

/* 6, not 10 — see WELL_INNER. */
const WELL_PAD_X = 6;
/* THE ONE RULE IN THE WELL: under its header. */
const WELL_RULE = A.HAIRLINE;

/* THE WELL BLEEDS TO THE CARD EDGES, so its inner width is 244px — the width the
   marker/gap measurement table in RoundShape is measured at. That table is the
   binding constraint on the scorecard, so the x padding is 6 rather than 10: at
   10 the inner width falls to 236 and a leading double box sits 2.7px from the
   well edge, which is the clipping fault that geometry exists to fix. */
const WELL_INNER = CARD_W - WELL_PAD_X * 2;
/* Recorded so a future reader does not have to re-derive it. */
void WELL_INNER;

/* THE INK DOES THE HIERARCHY. One genuinely dark ink and greys that are clearly
   different from each other, not four middling greys. */
const INK = A.INK;   // scores and totals
const MID = A.MUTE;   // secondary text
const HAIRLINE_INK = A.HAIRLINE;

/* THREE CLEARLY DIFFERENT GREYS FOR THE BAND (§S4.2 of the band brief). A.FAINT
   and A.GHOST do not exist on the shared ramp, so the band names them here
   against the same ink. THE BAND TILES ARE NOT TOUCHED BY THIS BRIEF. */
const BAND_MUTE = MID;
const BAND_FAINT = A.DIM;



/* The card sits on the page rather than being drawn onto it. */
const CARD_SHADOW = '0 1px 2px rgba(11,15,20,0.05)';

/**
 * §3 (BRIEF_BAND_TILES_LADDER_TIGHTEN) — THE FIGURE COLUMN IS MEASURED.
 * Tabular lining figures have a fixed advance, so the column can be derived
 * arithmetically from the strings a tile actually prints: 0.6em per figure,
 * sign or arrow glyph, 0.3em for a decimal point. A tile must not reserve
 * space for a qualifier it never shows (BEST STABLEFORD's old 40px gap).
 */
const BAND_FIG_SIZE = 12;
const BAND_QUAL_SIZE = 8;
const BAND_QUAL_GAP = 2;
const bandGlyphEm = (ch: string) =>
  /[0-9+\u2212\u2193\u2014-]/.test(ch) ? 0.6 : ch === '.' ? 0.3 : 0.28;
const bandTextWidth = (s: string, size: number) =>
  [...s].reduce((w, ch) => w + bandGlyphEm(ch) * size, 0);
export const bandFigureColumnWidth = (
  figures: { text: string; qual?: string }[],
) =>
  Math.ceil(
    Math.max(
      9,
      ...figures.map(
        (f) =>
          bandTextWidth(f.text, BAND_FIG_SIZE) +
          (f.qual ? BAND_QUAL_GAP + bandTextWidth(f.qual, BAND_QUAL_SIZE) : 0),
      ),
    ),
  );


/**
 * TILE HEIGHT. hero 156 + 8 pad + 20 member row + 8 + well (6 header + 6 +
 * 1 rule + 7 + 96 grid + 9 pad = 135) = 327. THE WELL RUNS TO THE CARD'S
 * BOTTOM EDGE — there is no card padding beneath it, so the tint finishes the
 * tile instead of stopping 10px short. EVERY KIND LANDS ON IT because the grid
 * region is fixed, INCLUDING a round with NO HOLE DATA (§S1.7, ACCEPTANCE Q).
 */
const WELL_H = 139;
const CARD_MIN_H = 331;

/** Amber is the viewing member and nothing else (§7). */
const AMBER = '#F7931E';

/* THE LIGHT-SURFACE INDEX MOVEMENT PAIR IS GONE FROM THIS FILE
   (BRIEF_ROUND_TILE_HERO_TOUR_COLOUR §5.3): the only movement figure on this
   surface is the member row's, it now sits on the dark hero, and an index
   movement is not a to-par score — so it is white-at-alpha and the TRIANGLE
   carries the direction. */

/* ===================== THE MEMBER ROW ON DARK (BRIEF_ROUND_TILE_PHOTO_THROUGH_MEMBER_ROW §2,
   RECOLOURED BY BRIEF_ROUND_TILE_HERO_TOUR_COLOUR §5.3)
   The row sits INSIDE the dark region, over the tour's gradient and scrims, so
   it obeys the hero's colour law: WHITE OR WHITE-AT-ALPHA, and a SCORE takes the
   canonical to-par grammar on dark. The light values above stay put because the
   band tiles and the well still use them. */
/** Names and grosses: the hero's own white, so one white runs down the block. */
const ROW_DARK_INK = 'rgba(255,255,255,0.94)';
/** Over/level par, and every quiet value on dark. FLOORED AT 0.78
    (BRIEF_HERO_TEXT_FLOOR_AND_DELTA §1): PhotoBand's 0.62 is unreadable at
    10.5px over a photograph. The INDEX MOVEMENT no longer uses this — see below. */
const ROW_DARK_QUIET = 'rgba(255,255,255,0.78)';
/** THE INDEX MOVEMENT KEEPS ITS COLOUR (§2). Colour where it means something:
    a falling index is better (green), a rising one is worse (red). The tour hero
    has no index movement, so PhotoBand's "colour only on a score" never governed
    this figure. Applies to the TRIANGLE and its FIGURE alike. */
const ROW_DARK_INDEX_FELL = INDEX_DELTA.dark.improved;
const ROW_DARK_INDEX_ROSE = INDEX_DELTA.dark.drifted;
/** UNDER PAR RESOLVES THROUGH getScoreColor — no hand-picked hex. TOPAR_RED
    (#C8102E) is the LIGHT-surface red and goes muddy on a scrimmed photograph. */
const ROW_DARK_TOPAR_UNDER = getScoreColor(-1, 'dark', 'standard');




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
          /* THE CLIP IS RELEASED WHEN THE DRAW ENDS. inset(0 0 0 0) still clips
             at the border box, and the mini-grid's markers paint their outer
             RING 3px OUTSIDE their own box — so a settled card was shaving the
             bottom of the bottom row's circles and boxes. A wipe needs no clip
             once it has finished, so there is none. */
          clipPath: complete ? 'inset(-8px -8px -8px -8px)' : 'inset(-8px 100% -8px -8px)',
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
            /* §S4.5 — the pill tightens to 4px 11px at 9.5px, in the new ink. */
            fontSize: 9.5,
            color: MID,
            border: `1px solid ${HAIRLINE_INK}`,
            borderRadius: 999,
            padding: '4px 11px',
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
          fontSize: 9.5,
          color: '#FFFFFF',
          background: INK,
          border: `1px solid ${INK}`,
          borderRadius: 999,
          padding: '4px 11px',
          cursor: 'pointer',
        }}
      >
        {t('discover.golfThisWeek.follow', 'FOLLOW')}
      </button>
    </span>
  );
}


/* =============================================================================
   COLOUR — THE RULE THAT KEEPS IT HONEST (BRIEF_ROUND_TILE_THE_MOMENT v2 §S5).
   READ THIS BEFORE CHANGING ANY COLOUR ON THIS CARD.

   §S5.1  THE HERO IS EXPRESSIVE. The moment's tone (#FFC93C eagle, #C8102E in
          red, #3B9DFF the finish, #22D07A the run, #F7931E the grind, #FFFFFF
          plain) is a CELEBRATION ACCENT and NOTHING UP THERE IS MEASURED.

   §S5.2  THE SCORECARD IS LITERAL. RED IS UNDER PAR, INK IS OVER, ALWAYS.

   §S5.3  A SCORE MARKER IS A CLOSED SHAPE AROUND THE DIGIT. A MOMENT NEVER
          DRAWS ONE, IN ANY TONE, ON ANY HOLE (BRIEF_ROUND_MOMENTS_V3 §1).
          The previous exception — "the moment's own holes take the hero tone" —
          is OVERTURNED because it defeated §S5.2: the in-red tone and the
          under-par ink are THE SAME STRING (#C8102E), so a marked par rendered
          as an eagle. markerStyle no longer accepts a tone at all.
          A marked hole is instead a 2px RULE BENEATH the cells in the moment's
          tone (§4). An open line below the digit can never be confused with a
          closed shape around it, whatever the tone, and it expresses the
          continuity a per-cell mark cannot — which is the whole point of THE
          RUN.

   WITHOUT THIS RULE the moment palette leaks into the grid within a month and
   red stops meaning under par — which every other scoring surface in the app
   depends on. Do not tint a marker with a moment tone unless that hole is in
   `moment.markedHoles`.
   ========================================================================== */

/**
 * A LABEL ABOVE A FIGURE IS READ AS NAMING THAT FIGURE (§S2.6).
 * If the figure is an IDENTITY the prefix is the noun (HOLE 13); if it is a
 * QUANTITY the noun follows it (14 HOLES). NEVER ABOVE.
 *
 * This was a real defect found on device: "HOLES" set over "14" read as
 * "hole 14". The figure phrase is therefore ONE translatable template with a
 * {n} placeholder (SINGLE braces, deliberately: i18next owns {{...}} and would
 * try to interpolate it), split at render time so the number takes 46px and the words
 * around it take 13px ON THE SAME LINE.
 */
const FIGURE_PLACEHOLDER = '{n}';

/**
 * BRIEF_ROUND_TILE_COURSE_PHOTO + BRIEF_ROUND_TILE_HERO_TOUR_COLOUR — the course
 * thumbnail sits BEHIND the hero as atmosphere, and the whole recipe is now the
 * Tour Overview hero's, imported unmodified: COURSE_GRADIENT as the base,
 * COURSE_SCRIMS, HERO_TOP_SCRIM and the tile-local bottom scrim (§4.2).
 *
 * ONLY THE GEOMETRY IS SCALED. The tour's stops are tuned at 80px / 260px
 * against a ~380px hero; on a 156px tile a 260px bottom scrim would blacken the
 * whole photograph. The same stops at tile scale is what "match" means here.
 *
 * COURSE_SCRIMS' GREEN RADIAL IS BACK. It was dropped, and a flat veil put in
 * its place, only because it competed with the moment glow. THE MOMENT GLOW IS
 * GONE (§4), so that reason is gone with it and the veil is deleted.
 *
 * LAYER ORDER MATCHES PhotoBand: base gradient, image, COURSE_SCRIMS, bottom
 * scrim, top scrim.
 */
/* THE PROPORTIONS ARE THE TOUR'S, RE-DERIVED AGAINST THE MEASURED DARK REGION
   (BRIEF_ROUND_TILE_HERO_TOUR_MATCH §4.3). The tour: band 286, top 80 (28.0%),
   bottom 260 (90.9%). The tile's dark region is 191 (156 hero + 8 pad + 19
   member row + 8 pad), so 28.0% -> 53 and 90.9% -> 174. The old 48 / 159 were
   proportionally lighter (25% / 83%) while carrying MORE text than the tour's
   band — course, region, eyebrow, figure, sentence and the whole member row. */
const DARK_REGION_H = 191;
const PHOTO_TOP_SCRIM_H = Math.round(DARK_REGION_H * 0.28);      // 53
const PHOTO_BOTTOM_SCRIM_H = Math.round(DARK_REGION_H * 0.909);  // 174

/* §4.2 — THE BOTTOM SCRIM IS INLINE, NOT THE EXPORTED HERO_BOTTOM_SCRIM.
   PhotoBand does NOT render the exported constant either: it takes the first
   three stops and ends the last one on the colour of the band BELOW, so the
   seam is invisible and the green base cannot bleed through as a cast.
   THE PRINCIPLE, NOT THE VALUE: the tile's next band is the LIGHT well
   (#F2F5F8), and ending on that would blow a pale band across the bottom of
   the photograph. So the tour's first three stops EXACTLY, and a final stop at
   FULL opacity on the tile's own darkest point instead of 0.92 — at 0.92
   COURSE_GRADIENT's sand bottom stop (#d4c89c) casts beneath the member row.
   The exported constant is untouched; other surfaces use it. */
const TILE_BOTTOM_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,1) 100%)';

/* NO PHOTO CAP (BRIEF_GOLF_THIS_WEEK_UNCAP §2). Every tile carries its course
   photograph. The old six-tile limit saved requests that were never going to
   fire — the images are loading="lazy" / decoding="async", so in a horizontal
   rail only tiles at or near the viewport fetch anything — while costing the
   treatment its consistency (the seventh tile read as a different card). Do not
   reintroduce it on that reasoning. */


const fmtRel = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`);

/**
 * THE COPY (§S6) — THE SENTENCE IS THE HIGHEST-RISK ELEMENT ON THE CARD. Every
 * label, figure phrase and sentence is a FIXED TEMPLATE PER KIND with figures
 * interpolated into NUMBERED placeholders so a translator can reorder them
 * (§S6.3). NEVER free text, never anything that could read as sarcastic, and
 * THE SENTENCE NEVER REPEATS THE FIGURE (§S2.8) — the figure states, the
 * sentence explains.
 *
 * EAGLE / ACE / ALBATROSS stay untranslated in English (§S6.4).
 */
const MK = 'discover.golfThisWeek.moment';

const LABEL_FALLBACK: Record<string, string> = {
  eagle: 'EAGLE',
  ace: 'ACE',
  albatross: 'ALBATROSS',
  finishedInRed: 'FINISHED IN THE RED',
  birdieHaul: 'BIRDIE HAUL',
  strongFinish: 'STRONG FINISH',
  run: 'THE RUN',
  grind: 'THE GRIND',
};

const FIGURE_FALLBACK: Record<string, string> = {
  hole: `HOLE ${FIGURE_PLACEHOLDER}`,
  holes: `${FIGURE_PLACEHOLDER} HOLES`,
  inThree: `${FIGURE_PLACEHOLDER} IN THREE`,
  inARow: `${FIGURE_PLACEHOLDER} IN A ROW`,
  /* A QUANTITY TAKES ITS NOUN AFTER THE FIGURE (§S2.6). */
  birdies: `${FIGURE_PLACEHOLDER} BIRDIES`,
};

const SENTENCE_FALLBACK: Record<string, string> = {
  eagle: 'A {{0}} on a par {{1}}.',
  /* THE NEW RULE IS THE FINISHING SCORE (§2.1), so the sentence states that and
     nothing about going under par along the way. */
  finishedInRed: 'Eighteen holes finished under par.',
  birdieHaul: '{{0}} birdies across {{1}} holes.',
  strongFinish: 'Birdie or better coming home, to finish on {{0}}.',
  run: 'Par or better from {{0}} through {{1}}.',
  grind: 'Nothing worse than a bogey all the way round.',
  plain: '{{0}} of {{1}} holes at par or better.',
  noHoles: 'A round played. The hole by hole detail was not recorded.',
};

type TFn = (k: string, d?: string, o?: object) => string;

function momentLabel(m: Moment, t: TFn): string | null {
  if (!m.labelKey) return null;
  return t(`${MK}.label.${m.labelKey}`, LABEL_FALLBACK[m.labelKey]);
}

function momentSentence(m: Moment, t: TFn): string {
  const f = m.facts;
  const key = `${MK}.sentence.${m.sentenceKey}`;
  const fb = SENTENCE_FALLBACK[m.sentenceKey];
  switch (m.sentenceKey) {
    case 'eagle':
      return t(key, fb, { 0: f.strokes, 1: f.par });
    case 'finishedInRed':
      /* THE SENTENCE NEVER REPEATS THE FIGURE (§S2.8) and the figure IS the
         to-par here, so the sentence carries no number at all. */
      return t(key, fb);
    case 'birdieHaul':
      return t(key, fb, { 0: f.count, 1: f.played });
    case 'strongFinish':
      return t(key, fb, { 0: fmtRel(f.toPar ?? 0) });
    case 'run':
      return t(key, fb, { 0: f.from, 1: f.to });
    case 'plain':
      return t(key, fb, { 0: f.parOrBetter, 1: f.played });
    default:
      return t(key, fb);
  }
}

/**
 * THE FIGURE LINE. The template is split on {{n}}: the words before and after
 * render at 13px / 700 / 0.14em at 50% white, the number at 46px / 800, ALL ON
 * ONE BASELINE (§S2.4, §S2.6). A PLAIN round has no template — its figure is the
 * gross with the to-par beside it (§S2.7).
 */
function FigureLine({
  moment,
  gross,
  toParText,
  t,
}: {
  moment: Moment;
  gross: number | null;
  toParText: string | null;
  t: TFn;
}) {
  /* THE FIGURE TAKES THE MOMENT'S TONE IF AND ONLY IF IT IS A SCORE
     (BRIEF_ROUND_TILE_MARK_AND_FIGURE §1). A QUANTITY is a count, not a score:
     "8 IN A ROW" in green would be decoration, and §S1.4 exists to stop exactly
     that. A SCORE carries a to-par meaning — on FINISHED IN THE RED the figure
     IS the round's to-par — so colouring it is the same rule that puts the red
     on BEST THIS WEEK's -3. PLAIN's tone is white, so it is unchanged. The
     NOUN and the sentence stay as they are. */
  const numStyle: React.CSSProperties = {
    ...NUMF,
    fontSize: 46,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.06em',
    /* §5.2 — THE RULE IS UNCHANGED, THE SOURCE OF THE COLOUR IS NOT: a
       score-role figure resolves through getScoreColor, the same call PhotoBand
       makes, and never through moment.tone. They may render the same red today;
       only one of them is the to-par grammar. A QUANTITY stays white. */
    color:
      moment.figureRole === 'score' && moment.figure != null
        ? getScoreColor(moment.figure, 'dark', 'standard')
        : '#FFFFFF',
  };

  const wordStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.14em',
    lineHeight: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.78)',
  };

  if (moment.figureRole === 'score' && moment.figure != null) {
    /* FINISHED IN THE RED: the round's to-par IS the figure, with a true minus
       (§5). No template, no noun — the eyebrow already said it. */
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
        <span style={numStyle}>{fmtRel(moment.figure)}</span>
      </div>
    );
  }

  if (moment.figureKey == null || moment.figure == null) {
    /* PLAIN: the gross, with the to-par beside it on the same line. */
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
        <span style={numStyle}>{gross ?? '\u2014'}</span>
        {toParText && <span style={{ ...wordStyle, letterSpacing: '0.06em' }}>{toParText}</span>}
      </div>
    );
  }

  const template = t(
    `${MK}.figure.${moment.figureKey}`,
    FIGURE_FALLBACK[moment.figureKey],
  );
  const idx = template.indexOf(FIGURE_PLACEHOLDER);
  const before = idx >= 0 ? template.slice(0, idx).trim() : '';
  const after = idx >= 0 ? template.slice(idx + FIGURE_PLACEHOLDER.length).trim() : template;

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
      {before && <span style={wordStyle}>{before}</span>}
      <span style={numStyle}>{moment.figure}</span>
      {after && <span style={wordStyle}>{after}</span>}
    </div>
  );
}


interface CardProps {
  row: CircleRoundRow;
  shape: HoleShape | null;
  courseName: string | null;
  region: string | null;
  /** Course thumbnail, already fetched by useCourseCardMeta. May be null. */
  imageUrl?: string | null;
  showFollow: boolean;
  /** §2.2 — read from the SAME cached following-id set that drives showFollow. */
  isFollowed: boolean;
  viewerUserId: string | undefined;
  onPress: () => void;
}

/**
 * THE ROUND TILE IS A STORY, NOT A REPORT (BRIEF_ROUND_TILE_THE_MOMENT).
 *
 * Top to bottom (§S4.1): HERO 178 / member row with the score / THE WELL.
 *
 * IT GIVES UP COMPLETENESS DELIBERATELY (§S0.3). No treatment except the grind
 * shows all eighteen holes, because THE SCORECARD IS ONE TAP AWAY AND DOES IT
 * PROPERLY, and a rail tile that tries to be the scorecard ends up as a small
 * unreadable scorecard — which is exactly what shipped before this.
 *
 * THE PHOTOGRAPH IS GONE (§S4.6): the hero gradient replaces it, so the course
 * is named in words at the top of the hero.
 */
function GolfThisWeekCard({
  row,
  shape,
  courseName,
  region,
  imageUrl = null,
  showFollow,
  isFollowed,
  viewerUserId,
  onPress,
}: CardProps) {
  const { t } = useTranslation('courses');
  const toPar = toParFor(row);
  const toParUnder =
    row.gross != null && row.course_par != null && row.gross - row.course_par < 0;

  /* THE SELECTOR IS PURE AND LIVES IN ITS OWN MODULE (§S1.8). A round with no
     hole data returns PLAIN with no counts, and the well renders empty (§S1.7). */
  const moment = useMemo(() => selectMoment(shape?.holes ?? []), [shape]);
  const label = momentLabel(moment, t as TFn);
  const sentence = momentSentence(moment, t as TFn);
  const marked = useMemo(() => new Set(moment.markedHoles), [moment.markedHoles]);

  const delta = row.delta_index;
  const hasMovement =
    delta != null && Number.isFinite(delta) && Math.abs(delta as number) >= 0.05;

  /* ONE CHART ONLY (§S0.3): the scorecard. `shape === null` renders NOTHING and
     the well keeps its height — never a placeholder grid (§S1.7). */
  const grid = shape ? (
    <MiniScorecard shape={shape} well={WELL} marked={marked} momentTone={moment.tone} />
  ) : null;


  return (
    /* NOT A <button> (§S1.1): FollowButton is a real button and a button inside
       a button is invalid HTML — WebKit commonly never delivers the inner tap.
       Div + role="button" + Enter/Space keeps the whole tile operable, and
       THE WHOLE TILE OPENS THE SCORECARD SHEET (§S4.5). */
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
        border: 'none',
        boxShadow: CARD_SHADOW,
        width: CARD_W,
        /* EVERY TILE IS THE SAME SIZE (ACCEPTANCE G): the well is a FIXED height
           whatever it holds, and an empty well (no hole data) keeps it. */
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
      {/* ============ THE DARK REGION: HERO + MEMBER ROW (§1) ============
          ONE image, ONE scrim stack, both taller. The hero content and the
          member row are composed OVER it, so the photograph runs unbroken from
          the top of the tile to the bottom of the member row. A second stack
          behind the row could never be made to line up with this one. */}
      <div
        style={{
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          /* THE LAYERS SIT AT zIndex -1, WHICH ONLY WORKS INSIDE A STACKING
             CONTEXT. position:relative with z-index auto is NOT one, so the
             photo painted BEHIND the element's own background and the tile
             looked unchanged. `isolation: isolate` makes the hero a stacking
             context; only applied when there IS an image so the no-image tile
             is byte-identical. */
          isolation: imageUrl ? 'isolate' : undefined,
          /* §2 — THE TOUR'S BASE. An imaged tile and a non-imaged tile now
             differ only by the presence of the photograph, which is what the
             tour does. */
          background: COURSE_GRADIENT,
        }}
      >
        {/* THE SCRIM STACK RENDERS WITH OR WITHOUT A PHOTOGRAPH (ACCEPTANCE A):
            COURSE_GRADIENT is a bright green-to-sand, so the white content stack
            needs the same scrims over the bare gradient that it needs over an
            image. Only the <img> is conditional.
            zIndex -1 keeps every layer ABOVE the element's own background and
            BELOW the in-flow content, so the content stack is untouched. */}
        <>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
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
            {/* §3 — COURSE_SCRIMS, in PhotoBand's position in the stack. */}
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
                height: PHOTO_BOTTOM_SCRIM_H,
                background: TILE_BOTTOM_SCRIM,
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
                height: PHOTO_TOP_SCRIM_H,
                background: HERO_TOP_SCRIM,
                zIndex: -1,
              }}
            />
        </>
        {/* THE HERO'S OWN CONTENT BOX. HERO_H is unchanged (156) — §1 extends
            the dark REGION, not the hero's content box. */}
        <div
          style={{
            height: HERO_H,
            flexShrink: 0,
            padding: '11px 12px 11px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        {/* §S2.3 — course, region beneath, the day top-right. */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                color: 'rgba(255,255,255,0.94)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {courseName ?? row.course_name ?? t('discover.golfThisWeek.unknownCourse', 'A course')}
            </div>
            {region && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 9.5,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.78)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {region}
              </div>
            )}
          </div>
          <span
            style={{
              flexShrink: 0,
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

        <div style={{ flex: 1 }} />

        {/* §S2.4 — THREE STACKED LINES, read top to bottom.
            THE LABEL IS AN EYEBROW, NOT A CLAUSE (§S2.5). It previously sat
            ALONGSIDE the sentence and the two read as one run-on — "THE RUN Par
            or better". A label is a heading, so it sits on its own line above
            the figure and the sentence sits below it.
            THE PLAIN CARD HAS NO LABEL AT ALL (§S2.7). */}
        {label && (
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: 5,
              /* §5.1 — the moment eyebrow loses its tone: PhotoBand's own label
                 white-at-alpha, not a new value. The moments are distinguished
                 by their WORDS now. TWO EXCEPTIONS: THE RUN carries the same
                 green as a falling handicap index delta; FINISHED IN THE RED
                 carries the same under-par red as the tile's to-par figure. */
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

        <FigureLine
          moment={moment}
          gross={row.gross ?? null}
          toParText={toPar?.text ?? null}
          t={t as TFn}
        />

        {/* THE SENTENCE, at the very bottom of the hero, from a fixed template.
            IT NEVER REPEATS THE FIGURE (§S2.8): the figure states, the sentence
            explains. */}
        <div
          style={{
            marginTop: 7,
            fontSize: 10.5,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'rgba(255,255,255,0.82)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {sentence}
        </div>
        </div>

        {/* THE MEMBER ROW, NOW INSIDE THE DARK REGION (§1, §2). Its STRUCTURE,
            sizes, weights, padding and 7px gap are untouched — only the colours
            take their dark counterparts. The 8px above and 8px below are the
            same 8s it had as a white row, so the tile's total height is
            unchanged (ACCEPTANCE G). */}
        <div style={{ padding: '8px 10px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          {/* §2.5 — THE RING COMES BACK ON DARK. hideRing was right on white,
              where the avatar's own edge read against the card; over a scrimmed
              photograph a dark avatar dissolves into the scrim. The canonical
              DARK_HAIRLINE (white @ 22%) traces it at 0.5px — the same ring
              every avatar on a dark surface carries. */}
          <SquircleAvatar
            src={row.profile_photo_url}
            userId={row.user_id}
            alt={row.display_name}
            size={19}
            hairlineRing
            ringColor={DARK_HAIRLINE}
          />
          <span
            style={{
              minWidth: 0,
              flex: '0 1 auto',
              fontSize: 12,
              fontWeight: 600,
              /* AMBER IS THE ONE DELIBERATE DIVERGENCE FROM PhotoBand's
                 "never amber" (§5.4). That rule governs a CTA, and a tour hero
                 has no concept of "you"; amber means THE VIEWING MEMBER
                 app-wide and this rail is substantially the member's own
                 rounds. Do not remove it as an oversight, and do not copy it
                 into the tour. Everything else here is white. */
              color: row.is_self ? AMBER : ROW_DARK_INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.display_name}
          </span>

          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 5,
              flexShrink: 0,
            }}
          >
            {/* §2.2 — the gross: INK -> white. */}
            <span style={{ ...NUMF, fontSize: 14, lineHeight: 1, color: ROW_DARK_INK }}>
              {row.gross ?? '\u2014'}
            </span>
            {toPar && (
              <span
                style={{
                  ...NUMF,
                  fontSize: 10.5,
                  lineHeight: 1,
                  /* §5.3 — the canonical dark under-par red via getScoreColor,
                     white-at-alpha for over/level. Never TOPAR_RED, never grey. */
                  color: toParUnder ? ROW_DARK_TOPAR_UNDER : ROW_DARK_QUIET,
                }}
              >
                {toPar.text}
              </span>
            )}
            {hasMovement && (
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                <IndexMovementTriangle
                  direction={(delta as number) < 0 ? 'down' : 'up'}
                  /* §2 — the DIRECTION rule is unchanged and the COLOUR is back. */
                  color={(delta as number) < 0 ? ROW_DARK_INDEX_FELL : ROW_DARK_INDEX_ROSE}
                  size={7}
                />
                <span
                  style={{
                    ...NUMF,
                    fontSize: 10.5,
                    lineHeight: 1,
                    color: (delta as number) < 0 ? ROW_DARK_INDEX_FELL : ROW_DARK_INDEX_ROSE,
                  }}
                >
                  {Math.abs(delta as number).toFixed(1)}
                </span>
              </span>
            )}
          </span>

          {showFollow && (
            <FollowButton
              targetUserId={row.user_id}
              isFollowed={isFollowed}
              viewerUserId={viewerUserId}
              align="gap"
            />
          )}
        </div>
        </div>
      </div>

      {/* THE SCORECARD HALF. The well keeps its own container so it still bleeds to
          the card edges. */}
      <div style={{ padding: '0 10px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* ===================== THE SCORECARD WELL (§S4) =====================
            A DARK FEED WELL WITH A HAIRLINE (BRIEF_DARK_ONLY_PART_B §2.2). The
            boundary is DRAWN rather than implied by a tone. The tint and the
            border are ALTERNATIVES, not additions.
            IT RUNS TO THE CARD'S BOTTOM EDGE: the well finishing 10px short of
            the tile read as an unfinished panel, so the bottom corners take the
            CARD's radius and the card has no padding beneath it. Its height is
            fixed whatever it holds, so an empty well keeps the rail level
            (ACCEPTANCE K, Q). */}

        <div
          style={{
            /* THE WELL'S 8px OFFSET MOVED UP INTO THE DARK REGION'S BOTTOM
               PADDING (BRIEF_ROUND_TILE_PHOTO_THROUGH_MEMBER_ROW §1) — the row's 8/8
               now sits inside the dark block, so keeping a margin here as well would
               add 8px to the tile. The total height is unchanged. */
            marginTop: 0,
            marginLeft: -10,
            marginRight: -10,
            marginBottom: 0,
            minHeight: WELL_H,
            flex: 1,
            background: WELL,
            /* §2 (BRIEF_ROUND_TILE_WHITE_WELL, superseding §2 of
               BRIEF_DISCOVER_FINISHING_PASS) — THE WELL'S EDGE IS DRAWN ON ALL
               FOUR SIDES. WELL is now the card's colour, so without a boundary the
               well has no edge at all. The rule is WELL_RULE, the token that
               already exists for the header line — not a second rule colour.
               INSET BOX-SHADOW, NOT A BORDER: the well is box-sizing: border-box
               with a fixed minHeight, so a 1px border would take 2px off the inner
               height AND 2px off the 244px inner width the marker/gap table in
               RoundShape is measured at. An inset shadow costs no layout.
               NOT a darker fill (the markers use `well` as their ring spacer) and
               NOT an outer shadow (the CARD already carries CARD_SHADOW). */
            boxShadow: `inset 0 0 0 1px ${WELL_RULE}`,

            borderRadius: `0 0 ${WELL_RADIUS}px ${WELL_RADIUS}px`,
            padding: `6px ${WELL_PAD_X}px 9px`,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 6,
              paddingBottom: 6,
              borderBottom: `1px solid ${WELL_RULE}`,
            }}
          >
            {/* §3 — the row label darkens to the card's ink with the rest of the
                chrome. */}
            <span style={{ ...LABEL, fontSize: 8, color: INK }}>
              {t('discover.golfThisWeek.moment.theCard', 'The card')}
            </span>
            {/* THE TAP AFFORDANCE, ON EVERY CARD (§S4.2). A hero with a hidden
                scorecard is a card nobody taps. */}
            <span
              style={{
                ...LABEL,
                fontSize: 8,
                /* §3 — the action and its chevron darken to the card's ink. */
                color: INK,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {t('discover.golfThisWeek.moment.fullScorecard', 'Full scorecard')}
              <ChevronRight size={9} strokeWidth={3} />
            </span>
          </div>

          <div
            style={{
              height: GRID_H,
              marginTop: 7,
              paddingBottom: 4,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* A ROUND WITH NO HOLE DATA RENDERS AN EMPTY WELL (§S1.7, Q) — the
                height is held so the rail stays level, and there is no
                placeholder grid. */}
            <ShapeReveal>{grid}</ShapeReveal>
          </div>
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

  /* ONE batched hole-shape read for the whole rail — never one per card. */
  const scoreIds = useMemo(() => ordered.map((r) => r.score_id), [ordered]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  /* NO INSIGHT MAP. The tile's prose is the MOMENT SENTENCE, generated from a
     fixed template per kind inside the card (BRIEF_ROUND_TILE_THE_MOMENT §S4.3).
     buildInsightMap survives for the see-all sheet, which still renders rows. */


  const pending = !!userId && (roundsQuery.isPending || !scopeCourses.ready);
  if (pending) return <GolfThisWeekShell />;

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
     labelled 'best' is a bug to the member who actually holds it.

     THAT RULE IS ABOUT THE FOUR TILES AND IT STILL STANDS — nothing here
     dedupes ACROSS tiles, and a member may hold first place in all four at
     once.

     WITHIN A SINGLE TILE THE ANSWER IS THE OPPOSITE (BRIEF_BAND_TILES_TOP_THREE
     §2), and the two rules read as contradictory only until the question is
     read: a tile now shows a TOP THREE, so the question is no longer "who is
     best at this" but "who else is worth seeing". A MEMBER APPEARS AT MOST ONCE
     IN ANY ONE TILE; where they hold several qualifying rounds we keep their
     best and drop the rest.
     WHY: in Ben's own data danny.akers1 played four times in the window and
     holds first AND second in two tiles. Uncapped, the chip becomes one
     member's week rather than the circle's — less engaging than the single
     winner it replaces, not more. The point of the change is showing more
     PEOPLE.
     THE COST, PLAINLY: the third row is then NOT literally the third-best
     round. The tile is a top three OF MEMBERS, not of rounds. That is the same
     objection the paragraph above raised about deduping, answered differently
     because the question is different.
     THE HERO IS ALWAYS THE OUTRIGHT WINNER — the cap only affects places 2
     and 3. */

  /* TIES GO TO THE MOST RECENT ROUND in every tile (unchanged): `ordered` is
     lens-ordered, not date-ordered, so recency is compared explicitly. The
     reducers this replaced applied exactly this tiebreak; a sort with the same
     comparison returns the same winner and, additionally, the places behind
     it (§1). NO QUERY, NO RPC, NO NEW FIELD — every place is derived from
     `ordered`, and a place that cannot be derived does not exist. */
  const byDateDesc = (a: CircleRoundRow, b: CircleRoundRow) =>
    String(b.play_date).localeCompare(String(a.play_date));

  /** §2 — one place per member, best kept, at most three places. */
  const topThree = (rows: CircleRoundRow[]) => {
    const seen = new Set<string>();
    const out: CircleRoundRow[] = [];
    for (const r of rows) {
      if (seen.has(r.user_id)) continue;
      seen.add(r.user_id);
      out.push(r);
      if (out.length === 3) break;
    }
    return out;
  };

  /* THE FLOORS APPLY TO EVERY PLACE (§3): a runner-up clears the same floor as
     the winner, so a tile with one qualifier shows the hero and NOTHING else —
     no second row, no dash, no placeholder. That is a normal week. */
  const bestRanked = topThree(
    ordered
      .filter((r) => r.gross != null && r.course_par != null)
      .sort((a, b) => {
        const at = (a.gross as number) - (a.course_par as number);
        const bt = (b.gross as number) - (b.course_par as number);
        if (at !== bt) return at - bt;
        if (a.gross !== b.gross) return (a.gross as number) - (b.gross as number);
        return byDateDesc(a, b);
      }),
  );

  const improvedRanked = topThree(
    ordered
      .filter(
        (r) =>
          r.delta_index != null &&
          Number.isFinite(r.delta_index) &&
          (r.delta_index as number) < 0,
      )
      .sort(
        (a, b) =>
          (a.delta_index as number) - (b.delta_index as number) || byDateDesc(a, b),
      ),
  );

  /* NULL STABLEFORD FAILS THE FILTER, never contributes a 0 (§1.3). FLOOR 36 —
     the par-equivalent every club golfer knows. */
  const stablefordRanked = topThree(
    ordered
      .filter(
        (r) =>
          r.stableford_points != null &&
          Number.isFinite(r.stableford_points) &&
          (r.stableford_points as number) >= 36,
      )
      .sort(
        (a, b) =>
          (b.stableford_points as number) - (a.stableford_points as number) ||
          byDateDesc(a, b),
      ),
  );

  /* FLOOR 3 — "1 birdie" is not a comparison, and a two-way tie on 1 is worse. */
  const birdiesRanked = topThree(
    ordered
      .filter(
        (r) => r.birdies != null && Number.isFinite(r.birdies) && (r.birdies as number) >= 3,
      )
      .sort((a, b) => (b.birdies as number) - (a.birdies as number) || byDateDesc(a, b)),
  );

  const bestStableford = stablefordRanked[0] ?? null;
  const mostBirdies = birdiesRanked[0] ?? null;
  const mostImproved = improvedRanked[0] ?? null;

  /* BRIEF_BAND_TILES_LADDER §0 — WHY THE HERO BLOCK WAS DISSOLVED. The chip
     carried TWO grammars, a hero block then a list, and four faults followed
     from that. Do not put it back:
       1. THE FIGURES DID NOT SHARE A COLUMN. 68 far left at 30px; 73 and 77 far
          right at 12px. Three numbers in two positions cannot be scanned, and
          scanning is what a ranking is for.
       2. THERE WAS A 2 AND A 3 BUT NO 1. Hero treatment implies first — until
          explicit ranks appear beneath it, when the absence reads as an omission.
       3. THE CHEVRON WAS ONLY ON THE LEADER, while all three rows were
          tappable, so it looked like that member's mark, not the card's.
       4. THE RUNNERS LOST THEIR QUALIFIER. The leader showed "68 -3", the
          others bare 73 and 77 — and on BEST THIS WEEK the to-par IS the
          comparison.
     All four are fixed by one ladder: one figure column, a rank on every row, a
     chevron on every row, and the qualifier either per-row (best) or once on
     the eyebrow as a column header (§2).

  /* BRIEF_BAND_TILES_REFINEMENT — the bottom line is the COURSE on every tile,
     and anything QUALIFYING the figure (a to-par, a unit) sits beside it on the
     figure's baseline. Colour appears only where it MEANS something: red on an
     under-par to-par, red on a birdie count, green on a falling index. The emoji
     marks the category; nothing else needs to. No accent bar, no tint. */
  const bandTiles: {
    key: string;
    emoji?: string;
    label: string;
    /** §2 — the UNIT, printed once on the eyebrow row as a column header.
        Absent on BEST THIS WEEK, whose qualifier is data and stays per-row. */
    unit?: string;
    row: CircleRoundRow;
    course: string;
    /** §2 — places 2 and 3, member-capped. Empty is a normal week. */
    runners: CircleRoundRow[];
    /** The tile's comparison for ONE row: the figure, and — only where the
        qualifier varies by round — that row's qualifier. */
    figureOf: (r: CircleRoundRow) => {
      text: string;
      tone: string;
      qual?: string;
      qualTone?: string;
    };
    /** §3 — the tile's WORST-CASE figure, so the measured column has a stable
        floor and does not jitter one digit when the scope pill changes the
        data under it. The column is max(measured rows, this). */
    figureFloor?: { text: string; qual?: string };
  }[] = [];


  /* §2 — BEST THIS WEEK's to-par is DATA, not a unit: it differs per round, so
     it is the one qualifier that stays beside every figure in the ladder. */
  const toParOf = (r: CircleRoundRow) => {
    if (r.gross == null || r.course_par == null) return null;
    const d = (r.gross as number) - (r.course_par as number);
    return {
      text: d === 0 ? 'E' : d < 0 ? `\u2212${Math.abs(d)}` : `+${d}`,
      tone: d < 0 ? TOPAR_RED : A.MUTE,
    };
  };

  if (best) {
    bandTiles.push({
      key: 'best',
      emoji: '\uD83D\uDD25', // FIRE
      label: t('discover.golfThisWeek.bestLabel', 'BEST THIS WEEK'),
      row: best.row,
      course: courseNameFor(best.row),
      /* The hero is `bestOfWeek`'s winner, unchanged; the sort's first place is
         the same row, so the runners are places 2 and 3 of that same list. */
      runners: bestRanked.slice(1),
      /* §S1.4 — the figure itself stays INK; only the to-par is coloured. What
         gets coloured is the TO-PAR, never the count. */
      figureOf: (r) => {
        const tp = toParOf(r);
        return {
          text: String(r.gross ?? '\u2014'),
          tone: INK,
          qual: tp?.text,
          qualTone: tp?.tone,
        };
      },
      figureFloor: { text: '77', qual: '+16' },
    });
  }
  if (bestStableford) {
    bandTiles.push({
      key: 'stableford',
      emoji: '\uD83C\uDFAF', // DIRECT HIT / DART BOARD
      label: t('discover.golfThisWeek.stablefordLabel', 'Best stableford'),
      unit: t('discover.golfThisWeek.stablefordUnit', 'points'),
      row: bestStableford,
      course: courseNameFor(bestStableford),
      runners: stablefordRanked.slice(1),
      figureOf: (r) => ({ text: String(r.stableford_points), tone: INK }),
      figureFloor: { text: '41' },
    });
  }
  if (mostBirdies) {
    bandTiles.push({
      key: 'birdies',
      emoji: '\uD83D\uDC26', // BIRD
      label: t('discover.golfThisWeek.birdiesLabel', 'Most birdies'),
      unit: t('discover.friendsRail.birdies', 'birdies'),
      row: mostBirdies,
      course: courseNameFor(mostBirdies),
      runners: birdiesRanked.slice(1),
      /* A birdie count IS a count of under-par holes, so the red is literal. */
      figureOf: (r) => ({ text: String(r.birdies), tone: TOPAR_RED }),
      figureFloor: { text: '5' },
    });
  }
  if (mostImproved) {
    bandTiles.push({
      key: 'improved',
      emoji: '\uD83D\uDCAA', // FLEXED ARM
      label: t('discover.golfThisWeek.improvedLabel', 'MOST IMPROVED'),
      unit: t('discover.friendsRail.index', 'HCP'),
      row: mostImproved,
      course: courseNameFor(mostImproved),
      runners: improvedRanked.slice(1),
      /* A falling index IS better — the index-delta scale, with a down arrow. */
      figureOf: (r) => ({
        text: `\u2193${Math.abs(r.delta_index as number).toFixed(1)}`,
        tone: A.IMPROVED,
      }),
      figureFloor: { text: '\u21930.4' },
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
          {/* The window is a THIRD SEGMENT OF THE SAME TEMPLATE so a translator
              can reorder all three. It is FIXED at seven days — never derived
              from the oldest round, which would make the window look like it
              moves on a quiet week. */}
          {t(
            'discover.golfThisWeek.count',
            '{{rounds}} rounds \u00B7 {{courses}} courses \u00B7 {{days}} days',
            {
              rounds: counts.rounds,
              courses: counts.courses,
              days: 7,
            },
          )}
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
      {ordered.length === 0 && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: A.MUTE,
            fontFamily: SANS,
            padding: '10px 0 0',
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
            alignItems: 'stretch',
            gap: 9,
            overflowX: 'auto',
            marginBottom: 12,
          }}
        >
          {bandTiles.map((tile) => (
            <div
              key={tile.key}
              /* EVERY BAND TILE IS ITS OWN ROUND, so tapping one opens THAT
                 round's scorecard — the same sheet the round tiles open. Not a
                 <button>: these tiles sit in the same family as the round tiles,
                 which cannot be buttons (a follow button lives inside them). */
              role="button"
              tabIndex={0}
              onClick={() => onCardPress(tile.row)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                  e.preventDefault();
                  onCardPress(tile.row);
                }
              }}
              style={{
                cursor: 'pointer',
                /* §S4.3 — the card loses its border and takes a shadow. Same
                   treatment as the round tiles: it sits on the page rather than
                   being drawn onto it. */
                background: A.PANEL,
                border: 'none',
                borderRadius: CARD_RADIUS,
                boxShadow: CARD_SHADOW,
                overflow: 'hidden',
                /* FOUR TILES DO NOT SHRINK (§3.1): the figure is the content, so
                   the band scrolls at 320px instead.
                   230, NOT 154 (BRIEF_BAND_TILES_TOP_THREE §4). 154 was set when
                   the chip held three lines; it now holds up to seven. At 154 a
                   real account name — "Notascratchgolfer", ~112px at 12/700 —
                   leaves no room for a rank, an avatar and a figure on one line
                   in ANY order. The WIDTH was out of date, not the row. About
                   2.2 chips fit across instead of 3, and the partly visible
                   third also signals that the rail scrolls. */
                flex: '1 0 230px',
                minWidth: 230,
                padding: '11px 12px 12px',

                fontFamily: SANS,
              }}
            >
              {/* THE EYEBROW ROW CARRIES THE UNIT (§2), right-aligned opposite
                  the label. Once three rows share one figure column, printing
                  "points" three times is noise — printed once at the top it is
                  a COLUMN HEADER, which is what it always was. BEST THIS WEEK
                  shows no unit: its to-par varies by round, so it is data and
                  stays beside every figure. */}
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: BAND_FAINT,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                {/* Emoji remain deliberate on celebratory band tiles. Their
                    platform-owned colours get a neutral local surface rather
                    than an unpredictable filter or shadow. */}
                <span
                  style={{
                    position: 'relative',
                    width: 11,
                    height: 11,
                    flex: '0 0 11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    lineHeight: 1,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: -2,
                      borderRadius: '50%',
                      background: WHITE_ALPHA_08,
                    }}
                  />
                  <span style={{ position: 'relative' }}>{tile.emoji}</span>
                </span>
                {tile.label}
                {tile.unit ? (
                  <span style={{ marginLeft: 'auto' }}>{tile.unit}</span>
                ) : null}
              </div>

              {/* ONE LADDER (§1). The hero block is DISSOLVED: every row —
                  including the leader's — has the same columns in the same
                  order, RANK, FIGURE, AVATAR, NAME, CHEVRON, and the figure
                  column is FIXED WIDTH and LEFT-ALIGNED so 68 / 73 / 77 stack
                  down one edge (its width MEASURED per tile, §3). The leader's
                  row is not BIGGER: BRIEF_BAND_TILES_LADDER_TIGHTEN drops its
                  figure to row size and marks first place three ways instead —
                  weight 800, an inked rank digit and a light ground on the row.
                  Its avatar stays 20 against 16; it costs no column width. */}
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {[tile.row, ...tile.runners].map((r, i) => {
                  const f = tile.figureOf(r);
                  const lead = i === 0;
                  /* §3 — MEASURED, NOT GUESSED. The column takes this tile's own
                     widest printed figure (plus its to-par where it has one) at
                     the new sizes, floored by the tile's worst case so the
                     ladder cannot shift a digit's width when the scope pill
                     changes the data. Rows 2 and 3 no longer pay for a leader's
                     size, and a tile without a qualifier reserves no room for
                     one — which is what closed the gap on BEST STABLEFORD. */
                  const figCol = bandFigureColumnWidth([
                    ...[tile.row, ...tile.runners].map(tile.figureOf),
                    ...(tile.figureFloor ? [tile.figureFloor] : []),
                  ]);
                  return (
                    <div
                      key={r.round_id}
                      /* §3 — EVERY ROW IS TAPPABLE, INCLUDING THE LEADER'S, and
                         the chip around them is itself role="button" with an
                         onClick and an Enter/Space handler. Without
                         stopPropagation a row tap would open TWO scorecards. */
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardPress(r);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                          e.preventDefault();
                          e.stopPropagation();
                          onCardPress(r);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                        cursor: 'pointer',
                        /* UNIFORM DIVIDERS (§1): the same hairline between every
                           pair of rows, none above the leader. */
                        borderTop: lead ? 'none' : `1px solid ${WELL_RULE}`,
                        /* LIGHT INK GROUND for first place: a subtle gray tint
                           that bleeds to the chip's padding edges. */
                        background: lead ? WHITE_ALPHA_04 : undefined,
                        borderRadius: lead ? CHIP_RADIUS : undefined,
                        margin: lead ? '0 -12px' : undefined,
                        padding: lead ? '6px 12px' : '8px 0',
                      }}
                    >
                      {/* EVERY ROW CARRIES ITS RANK (§1) — the leader's 1 is
                          PRESENT, not implied. It sits in its own 7px column at
                          the ladder's left edge so all three digits align.
                          §4.2 — the leader's digit takes INK; 2 and 3 stay
                          faint. */}
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          lineHeight: 1,
                          color: lead ? INK : BAND_FAINT,
                          fontVariantNumeric: 'tabular-nums lining-nums',
                          width: 7,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>

                      {/* THE FIGURE COLUMN — measured width, left-aligned, one
                          width for the whole tile so the three figures stack on
                          a single left edge. */}
                      <div
                        style={{
                          width: figCol,
                          flexShrink: 0,
                          /* §2 — the to-par is BOTTOM-ALIGNED with the gross, so
                              its foot sits level and it reads as tucked under the
                              gross's right shoulder rather than as a second
                              column on the same baseline. */
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: BAND_QUAL_GAP,
                          minWidth: 0,
                        }}
                      >
                        {/* §1 — EVERY FIGURE IS ROW SIZE. The leader is BOLD, not
                            BIG: 800 against 700 at the same 12px. Charging the
                            leader's size to every name in the tile is what made
                            real account names truncate. */}
                        <span
                          style={{
                            fontSize: BAND_FIG_SIZE,
                            fontWeight: lead ? 800 : 700,
                            lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums lining-nums',
                            color: f.tone,
                          }}
                        >
                          {f.text}
                        </span>
                        {f.qual ? (
                          <span
                            style={{
                              fontSize: BAND_QUAL_SIZE,
                              fontWeight: 700,
                              lineHeight: 1,
                              fontVariantNumeric: 'tabular-nums lining-nums',
                              color: f.qualTone ?? A.MUTE,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {f.qual}
                          </span>
                        ) : null}
                      </div>


                      <SquircleAvatar
                        src={r.profile_photo_url}
                        userId={r.user_id}
                        alt={r.display_name}
                        size={16}
                        hideRing
                      />
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: INK,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.display_name}
                      </span>
                      {/* THE CHEVRON IS ON EVERY ROW (§0.3). On the leader alone
                          it read as that member's mark rather than the card's
                          affordance, while all three rows were tappable. */}
                      <ChevronRight
                        size={9}
                        strokeWidth={3}
                        color={INK}
                        style={{ flexShrink: 0 }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* §1.1/§1.2 (BRIEF_DISCOVER_FINISHING_PASS) — THE COURSE LINE IS
                  GONE. This OVERTURNS BRIEF_BAND_TILES_REFINEMENT ("the bottom
                  line is the COURSE on every tile"), kept on the record rather
                  than deleted.
                  WHY: at 12/700 the line truncates before the informative part —
                  "Sundridge Park Gol..." does not separate East from West, the
                  one thing a member needs from it. The chip is tappable and the
                  sheet it opens leads with the course in full.
                  THE COST: the chip no longer says WHERE.

                  ABSENT IS ABSENT (BRIEF_BAND_TILES_TOP_THREE §3): fewer than
                  three qualifiers renders fewer rows — no dash, no placeholder,
                  no reserved height. The rail's `alignItems: 'stretch'` levels
                  every chip to the tallest, so a short tile simply carries an
                  empty area and nothing fills it. */}

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
        {ordered.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          return (
            <GolfThisWeekCard
              key={r.round_id}
              row={r}
              shape={holeShapes?.get(r.score_id ?? '') ?? null}
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

      {/* THE SEE-ALL ROW STAYS (§4.2). With the rail uncapped it no longer holds
          back rounds, so the condition is simply "there is something to open" —
          the sheet's value is its row form, day grouping and scope pills, and
          whether it still earns its place is Ben's call, not this brief's. */}
      {ordered.length > 0 && (
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
