import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';


/**
 * THE BOARD HERO IS THE TOUR OVERVIEW HERO. One photo-led hero treatment
 * across the app: the height is the canonical PHOTO BAND height
 * (`PHOTO_BAND_HEIGHT`, 286 + the safe-area inset absorbed, exactly as
 * PhotoBand does), the ramp is the canon scrim, and the lower third is the
 * same 20px gutter / 8px baseline column with the same type.
 */
/** §1.3 — the neutral loading ground. FLAT, so it can never read as a gradient. */
/** The when chip's ink — the hero's marker ink (PhotoBand momentLabel). */
const BOARD_HERO_FAINT = 'rgba(255,255,255,0.65)';

/** ~1.2s: long enough to register, short enough not to be a state (§S3.4). */
const CONFIRM_MS = 1200;


import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

import { toParFor, IndexMovementTriangle } from '../friendRoundParts';
import { heroCanonScrimOn } from '@/features/tourhub/_shared/heroGradient';
import { CHARCOAL } from '@/features/tourhub/_shared/tokens';

import {
  COURSE_GRADIENT,
  COURSE_SCRIMS,
  HERO_TOP_SCRIM,
  
} from '@/features/tourhub/components/overview-v3/HybridHero.constants';

/* MICRO_BRIEF_BOARD_HERO_CHIP_AND_RAIL §3 — the board hero's own height. Fixed,
   never derived from content, so it is 246 in every category and every state. */
const BOARD_HERO_HEIGHT = 246;


import { relativeDay } from './discoverWhen';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useRoundHoleShapes, type HoleShape } from './hooks/useRoundHoleShapes';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { useRoundNetScores } from './hooks/useRoundNetScores';
import { ReactionAction, ReactionSlot } from './ReactionAction';
import { useFollowingIdSet } from './hooks/useFollowingIdSet';


import {
  DEFAULT_WEEK_SCOPE,
  bestOfWeek,
  orderForWeek,
  usePlayedCourseIds,
  useGolfThisWeek,
  GOLF_WEEK_DAYS,
  useWeekCounts,
  useWeekScopeCourses,
  useViewerHandicapIndex,
  type WeekScope,
} from './hooks/useGolfThisWeek';

/**
 * BRIEF_BOARD_FIVE_CATEGORIES_AND_ROTATION §S2 — THE FIVE CATEGORIES, at module
 * scope so the session's rotation can be held beside them.
 */
type BoardKey = 'gross' | 'net' | 'stableford' | 'improved' | 'birdies';

/**
 * §2.5 — THE SESSION'S ROTATED DEFAULT lives in a MODULE-LEVEL variable, not in
 * React state and not in storage. That is deliberate on both sides:
 *   - it survives unmount, so tabbing away from Discover and back does not
 *     reshuffle the board under the member (§2.1);
 *   - it dies with the JS module, i.e. on a cold launch, so tomorrow rotates
 *     again and NOTHING is persisted (§2.4). No "last shown" store.
 * It is written ONCE per session, the first time a non-empty board exists.
 */
let sessionBoardKey: BoardKey | null = null;

/** §2.2b — the handicap lean. Under 5 leans ball-striking, 5+ leans the rest. */
const LOW_INDEX_LEAN: BoardKey[] = ['gross', 'birdies'];
const HIGH_INDEX_LEAN: BoardKey[] = ['net', 'stableford', 'improved'];
import { useWeekRegionCounts, type RegionSelection } from './hooks/useWeekRegionCounts';
import { RegionDropdown, WeekScopePills, scopeEmptyKey } from './WeekFilters';
import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import { BoardPicker } from './BoardPicker';
import {
  FINISHED_IN_RED_TONE,
  selectMoment,
  type Moment,
} from './roundMoment';

import { GolfThisWeekRail as GolfThisWeekShell } from './DiscoverCourseLedSkeleton';
import {
  A,
  CARD_RADIUS,
  CARD_SHELL,
  CHIP_RADIUS,
  DISCOVER_FACT,
  DISCOVER_QUIET,
  InkAction,
  KICKER,
  LABEL,
  NUMF,
  PODIUM_ACCENT,
  PODIUM_GROUND,
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

   §S0.3 IS OVERTURNED (AMENDMENT 1 TO BRIEF_ROUND_TILE_CURVE §A3). BOTH HALVES
   ARE RECORDED so neither is rediscovered:

   WHAT §S0.3 ACTUALLY REFUSED, and it still stands: a tile that CHOOSES BETWEEN
   a scorecard and a trajectory. Its words were "two chart types meant two
   heights, two sets of axis rules and a selector deciding presentation as well
   as content". NOTHING HERE REINTRODUCES A SELECTOR — do not add one.

   WHAT THIS DOES INSTEAD: adds ONE fixed element to EVERY tile. One shape, one
   height, no branch. The scorecard is neither replaced nor chosen against; the
   curve sits above it, inside the well, on every card, always.

   THE COST, ACCEPTED KNOWINGLY (§0): the curve and the eighteen marks are the
   same eighteen numbers. The marks say WHAT happened on each hole; the curve
   says WHERE the round went. Both stay. Do not remove the OUT/IN rows and do
   not shrink the marks to compensate.

   THE CURVE IS INSIDE THE WELL (§A4): the well is the round's DATA and the
   curve is data about the round. Above the well it would sit between the member
   row and the card and read as belonging to the member.

   THE PHOTOGRAPH IS GONE (§S0.4). PHOTO_H, the scrim and the glass chip tokens
   went with it; the hero gradient carries the top of the card. */

/* THE CARD IS 224 WIDE (BRIEF_DISCOVER_LOOSE_ENDS §S1). The real history: it
   SHIPPED at 256, BRIEF_GOLF_THIS_WEEK_P1_P3 §3.3 wrongly described that as 300
   and asked for 268 — which made the card WIDER, not narrower. Corrected to 224,
   which is not a new number: FriendsPlayedRail.tsx:58 is CARD_W = 224, chosen for
   "two-plus-a-slice at 390dp", the slice being the affordance that says the rail
   scrolls. Two rails on one page at two widths was the drift; matching is the fix.
   The 211px fixed height is untouched. */
const CARD_W = 224;

/** §S2.1 — the gradient hero. §3.3: 168 -> 132 (shipped value was 156). */
const HERO_H = 132;


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
const INK = DISCOVER_FACT;   // scores, names and totals are content
const MID = DISCOVER_QUIET;  // all quiet chrome shares one tier
const HAIRLINE_INK = A.HAIRLINE;

/* THREE CLEARLY DIFFERENT GREYS FOR THE BAND (§S4.2 of the band brief). A.FAINT
   and A.GHOST do not exist on the shared ramp, so the band names them here
   against the same ink. THE BAND TILES ARE NOT TOUCHED BY THIS BRIEF. */
const BAND_MUTE = MID;
const BAND_FAINT = DISCOVER_QUIET;

/* THE PILL ROW'S LEFT-EDGE GEOMETRY, NAMED ONCE
   (CORRECTION_BRIEF_PILL_MASK_GEOMETRY). THE INVARIANT: THE MASK BAND'S TOTAL
   WIDTH (the RegionDropdown well plus the feather) AND THE SCROLLER'S LEFT
   PADDING ARE THE SAME NUMBER: WELL_COLLAPSED_W + MASK_PROUD + MASK_FEATHER ===
   PILL_ROW_PADDING_LEFT. The feather's transparent edge reaches zero exactly
   where the first pill begins. If they diverge, either the resting pill gets a
   gradient on it (mask wider) or a pill becomes visible before the mask catches
   it (mask narrower). MASK_PROUD appears in TWO places — the feather's solid
   stop and the scroller's left padding — and they MOVE TOGETHER, which is why
   paddingLeft is derived here rather than written as a literal 62.
   WELL_COLLAPSED_W is the collapsed well's width (pin + chevron + side padding)
   as specified by the source brief; the feather itself is never sized from it,
   only this padding is. */
export const WELL_COLLAPSED_W = 51; // measured collapsed well width (pin + chevron + side padding)
export const MASK_PROUD = 8; // solid canvas past the well's right edge
export const MASK_FEATHER = 8; // gradient out to fully transparent
export const PILL_ROW_PADDING_LEFT = WELL_COLLAPSED_W + MASK_PROUD + MASK_FEATHER; // 67



/* The card sits on the page rather than being drawn onto it. */
const CARD_SHADOW = '0 1px 2px rgba(11,15,20,0.05)';

/**
 * TILE HEIGHT. hero 156 + 8 pad + 20 member row + 8 + well (6 header + 6 +
 * 1 rule + THE SHAPE 53 + 7 + 100 grid + 9 pad) = 384. THE WELL RUNS TO THE
 * CARD'S BOTTOM EDGE — there is no card padding beneath it, so the tint
 * finishes the tile instead of stopping 10px short. EVERY KIND LANDS ON IT
 * because both regions are fixed, INCLUDING a round with NO HOLE DATA
 * (§S1.7, ACCEPTANCE Q).
 */
/**
 * THE SHAPE's region. THE EYEBROW IS GONE and the curve takes the whole block:
 * the shape needs no label — it sits directly above the scorecard it summarises,
 * and 15px of the region spent on the word "THE SHAPE" was 15px not spent on the
 * curve. Block height is unchanged so the tile and its skeleton do not move.
 */
const SHAPE_H = 49;
const SHAPE_BLOCK_H = 53;
const WELL_H = 139 + SHAPE_BLOCK_H;
void SHAPE_H;
void WELL_H;

/**
 * BRIEF_GOLF_THIS_WEEK_P1_P3 §3.1/§3.4 — THE SCORECARD BLOCK IS BEHIND THE TAP.
 * The card is now hero (132) + member row (35) + the FOOT (44: an optional
 * SEE THE CARD action and the reaction). The foot's height is FIXED and the foot
 * is PINNED TO THE BOTTOM of the card (BRIEF_ROUND_CARD_STRIP_BACK §S3.3), so
 * every card's action row sits on the same line whatever is above it.
 */
const FOOT_H = 44;
const MEMBER_ROW_H = 35;
const CARD_MIN_H = HERO_H + MEMBER_ROW_H + FOOT_H;


/**
 * THE FILLS ARE MIXED ON THE WELL, NOT ON THE PANEL (§A5). TrajectoryLine's dark
 * fillOver/fillUnder are solids pre-mixed on #0B0D10 and are CORRECT on the four
 * surfaces that use them; the well is rgba(11,13,16,0.66) over the card, a
 * lighter ground, so the panel-mixed pair reads as a smudge here. These are the
 * same lightness step taken off the well's resolved colour. NEVER brighten the
 * shared tokens to fix this one surface.
 */
const SHAPE_FILL_OVER = '#3D424A';
const SHAPE_FILL_UNDER = '#4A2A2E';

/** Amber is the viewing member and nothing else (§7). */
const AMBER = '#F7931E';
/** §1.3 — the own-member WASH: the same amber, at the alpha a ground can carry. */
const AMBER_WASH = 'rgba(247, 147, 30, 0.10)';


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
const ROW_DARK_INK = DISCOVER_FACT;
/** Over/level par, and every quiet value on dark. FLOORED AT 0.78
    (BRIEF_HERO_TEXT_FLOOR_AND_DELTA §1): PhotoBand's 0.62 is unreadable at
    10.5px over a photograph. The INDEX MOVEMENT no longer uses this — see below. */
const ROW_DARK_QUIET = DISCOVER_QUIET;
/** THE INDEX MOVEMENT KEEPS ITS COLOUR (§2). Colour where it means something:
    a falling index is better (green), a rising one is worse (red). The tour hero
    has no index movement, so PhotoBand's "colour only on a score" never governed
    this figure. Applies to the TRIANGLE and its FIGURE alike. */
export const ROW_DARK_INDEX_FELL = INDEX_DELTA.dark.improved;
const ROW_DARK_INDEX_ROSE = INDEX_DELTA.dark.drifted;
/** Under-par figures use the exact filled-birdie-circle red. */
export const ROW_DARK_TOPAR_UNDER = FINISHED_IN_RED_TONE;




/* BRIEF_DISCOVER_LOOSE_ENDS §S4 — ShapeReveal and MiniScorecard are DELETED,
   not silenced. The card compression removed their last callers, and the `void`
   statements that kept them warning-free were the proof of that. The scorecard
   sheet keeps its own grid and trajectory curve; nothing here needs them. */

void SHAPE_BLOCK_H;



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
            /* Match PhotoBand's quiet action over photography exactly: no fill,
               no border, and white-62 ink. This is confirmation, not identity. */
            /* CAPS ACTION at the 11px floor, tracking 0.10em. */
            fontSize: 11,
            letterSpacing: '0.10em',
            color: MID,
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: '6px 4px',
            margin: '-6px -4px',
            textShadow: '0 1px 3px rgba(0,0,0,0.55)',
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
          /* CAPS ACTION at the 11px floor, tracking 0.10em. */
          fontSize: 11,
          letterSpacing: '0.10em',
          color: MID,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          padding: '6px 4px',
          margin: '-6px -4px',
          textShadow: '0 1px 3px rgba(0,0,0,0.55)',
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

/* §4.2 — THE BOTTOM SCRIM IS INLINE. There is no exported hero bottom scrim
   any more: PhotoBand runs the canon ramp (heroCanonScrimOn), taking the
   canon stops and ending the last one on the colour of the band BELOW, so the
   seam is invisible and the green base cannot bleed through as a cast.
   THE PRINCIPLE, NOT THE VALUE: the tile's next band is the LIGHT well
   (#F2F5F8), and ending on that would blow a pale band across the bottom of
   the photograph. So the tour's first three stops EXACTLY, and a final stop at
   FULL opacity on the tile's own darkest point instead of 0.92 — at 0.92
   COURSE_GRADIENT's sand bottom stop (#d4c89c) casts beneath the member row.
   The exported constant is untouched; other surfaces use it. */
const TILE_BOTTOM_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.70) 58%, rgba(0,0,0,0.94) 100%)';

/* NO PHOTO CAP (BRIEF_GOLF_THIS_WEEK_UNCAP §2). Every tile carries its course
   photograph. The old six-tile limit saved requests that were never going to
   fire — the images are loading="lazy" / decoding="async", so in a horizontal
   rail only tiles at or near the viewport fetch anything — while costing the
   treatment its consistency (the seventh tile read as a different card). Do not
   reintroduce it on that reasoning. */


export const fmtRel = (n: number) => (n === 0 ? 'E' : n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`);

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
  courseRecord: 'COURSE RECORD',
  finishedInRed: 'FINISHED IN THE RED',
  birdieHaul: 'BIRDIE HAUL',
  strongFinish: 'STRONG FINISH',
  run: 'THE RUN',
  grind: 'THE GRIND',
};

/**
 * MICRO_BRIEF_MOMENT_NOUNS_STAND_ALONE — THE NOUN CARRIES THE CLAIM ALONE.
 * The sentence and the kicker were removed beneath these words, so a noun that
 * only made sense above an explaining sentence now states nothing, or worse.
 *
 *   holes    was "{n} HOLES"     — on a golf app that reads as a ROUND LENGTH.
 *   inThree  was "{n} IN THREE"  — meaningless on its own.
 *
 * MEASURED AT 224 (inner 200 = 224 - 12 - 12 padding, minus the 7px gap):
 *   "AT PAR OR BETTER" is 154.3 and a two-digit grind figure is 45.7 -> 207.
 *   It does not fit, so §S2.3's shorter fallback "{n} CLEAN HOLES" (113.2 ->
 *   165.9) is used. "IN THE LAST THREE" is 158.8 against a one-digit 22.8 ->
 *   188.6, which DOES fit, so the longer, clearer form is kept there.
 *
 * `hole` stays a bare position because the KICKER above it names the feat for
 * identity moments (§S3.4) — "EAGLE ON HOLE 7" under an "EAGLE" kicker would
 * say it twice.
 */
const FIGURE_FALLBACK: Record<string, string> = {
  hole: `HOLE ${FIGURE_PLACEHOLDER}`,
  holes: `${FIGURE_PLACEHOLDER} CLEAN HOLES`,
  inThree: `${FIGURE_PLACEHOLDER} IN THE LAST THREE`,
  inARow: `${FIGURE_PLACEHOLDER} PARS IN A ROW`,
  /* A QUANTITY TAKES ITS NOUN AFTER THE FIGURE (§S2.6). */
  birdies: `${FIGURE_PLACEHOLDER} BIRDIES`,
};

const SENTENCE_FALLBACK: Record<string, string> = {
  eagle: 'A {{0}} on a par {{1}}.',
  courseRecord: "{{0}} shots better than {{1}}'s {{2}}.",
  courseRecordUnknown: '{{0}} shots better than the previous record of {{2}}.',
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

export type TFn = (k: string, d?: string, o?: object) => string;

export function momentLabel(m: Moment, t: TFn): string | null {
  if (!m.labelKey) return null;
  return t(`${MK}.label.${m.labelKey}`, LABEL_FALLBACK[m.labelKey]);
}

/**
 * THE FIGURE'S WORDS, split off the ONE translatable template so a second
 * surface (the page hero, BRIEF_DISCOVER_WORLD_CLASS §1) can print the same
 * noun placement without owning a second copy of the templates. The rule is
 * unchanged: an IDENTITY figure takes its noun BEFORE, a QUANTITY after.
 */
export function momentFigureParts(m: Moment, t: TFn): { before: string; after: string } {
  if (m.figureKey == null) return { before: '', after: '' };
  const template = t(`${MK}.figure.${m.figureKey}`, FIGURE_FALLBACK[m.figureKey]);
  const idx = template.indexOf(FIGURE_PLACEHOLDER);
  if (idx < 0) return { before: '', after: template };
  return {
    before: template.slice(0, idx).trim(),
    after: template.slice(idx + FIGURE_PLACEHOLDER.length).trim(),
  };
}

export function momentSentence(m: Moment, t: TFn): string {
  const f = m.facts;
  const key = `${MK}.sentence.${m.sentenceKey}`;
  const fb = SENTENCE_FALLBACK[m.sentenceKey];
  switch (m.sentenceKey) {
    case 'eagle':
      return t(key, fb, { 0: f.strokes, 1: f.par });
    case 'courseRecord':
    case 'courseRecordUnknown':
      return t(`${key}_${f.margin === 1 ? 'one' : 'other'}`, fb, {
        0: f.margin,
        1: f.heldBy,
        2: f.beatenGross,
        count: f.margin,
      });
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
     on BEST THIS WEEK's -3. The NOUN and the sentence stay as they are.

     BRIEF_DISCOVER_WORLD_CLASS §2 EXTENDS THIS TO THE PLAIN CARD'S GROSS. A
     gross IS a score — 83 and 78 were the largest numerals on the page and both
     rendered the same white, so a +12 looked exactly as good as a −3. It now
     resolves through the SAME getScoreColor call, so under par is the dark
     under-par red and level/over is ink-on-dark. No new value, no new rule; the
     member row's figures directly beneath already did this and are untouched. */
  /* THE RUN'S FIGURE AND NOUN ARE GREEN (BRIEF_RUN_GREEN_FIGURE). The run is a
     positive streak, so its quantity figure and the surrounding words take the
     same falling-index green as the eyebrow — the one moment where a quantity
     carries the moment's own colour. */
  const runGreen = moment.kind === 'run' ? ROW_DARK_INDEX_FELL : null;

  const numStyle: React.CSSProperties = {
    ...NUMF,
    fontSize: 46,
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: '-0.06em',
    /* Tile-hero figures are white to match the course name above, EXCEPT a
       score figure that carries to-par meaning (under-par red) and a RUN
       figure (green). FINISHED IN THE RED's figure IS the round's to-par, so
       it shares the same under-par red as the label and the birdie circles. */
    color:
      runGreen ??
      (moment.figureRole === 'score' && moment.figure != null && moment.figure < 0
        ? FINISHED_IN_RED_TONE
        : DISCOVER_FACT),
  };

  const wordStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.14em',
    lineHeight: 1,
    textTransform: 'uppercase',
    color: runGreen ?? DISCOVER_FACT,
  };

  if (moment.figureRole === 'score' && moment.figure != null) {
    /* FINISHED IN THE RED's figure is to-par and takes a true minus. COURSE
       RECORD's figure is gross, so it stays an unsigned score; its score colour
       still follows the round's to-par fact rather than the magenta identity. */
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
        <span
          style={{
            ...numStyle,
            color:
              moment.kind === 'courseRecord' && (moment.facts.toPar ?? 0) < 0
                ? FINISHED_IN_RED_TONE
                : numStyle.color,
          }}
        >
          {moment.kind === 'courseRecord' ? moment.figure : fmtRel(moment.figure)}
        </span>
      </div>
    );
  }

  if (moment.figureKey == null || moment.figure == null) {
    /* PLAIN: the gross and adjacent to-par are both hero white. */
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
        <span style={numStyle}>
          {gross ?? '\u2014'}
        </span>
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
  /* THE REFERENCE LINE AND ITS TIER LADDER ARE RETIRED
     (BRIEF_ROUND_CARD_STRIP_BACK §S2.3). The board directly above does all the
     comparing, so the card carries none: the prop, the derivation and the
     batched get_my_course_bests read are DELETED, not disabled. Do not
     reinstate — MICRO_BRIEF_REFERENCE_TIER_B is WITHDRAWN. */

  onPress: () => void;
  /**
   * REACTIONS (BRIEF_GOLF_THIS_WEEK_P2): resolved by the section from ONE
   * batched useContentReactions read keyed by the round's whs_score id — never
   * per card. `reactionHidden` covers no score id, signed out and the table
   * being unavailable: absent is absent, not a disabled glyph.
   */
  reactionCount?: number;
  reactionMine?: boolean;
  reactionHidden?: boolean;
  onToggleReaction?: () => void;
}


/**
 * THE ROUND TILE IS A STORY, NOT A REPORT (BRIEF_ROUND_TILE_THE_MOMENT).
 *
 * Top to bottom (§S4.1): HERO 178 / member row with the score / THE WELL.
 *
 * THIS CLAIM IS NO LONGER TRUE AND IS CORRECTED, NOT DELETED (AMENDMENT 1 §A3):
 * it read "IT GIVES UP COMPLETENESS DELIBERATELY (§S0.3) — no treatment except
 * the grind shows all eighteen holes". The mini scorecard already draws eighteen
 * marks, and THE SHAPE now draws the same eighteen numbers cumulatively, so the
 * tile is complete twice over.
 * WHAT SURVIVES OF THE ORIGINAL WARNING: a rail tile must not try to BE the
 * scorecard — no figures per hole, no columns, no yardages. THE SCORECARD IS
 * STILL ONE TAP AWAY and still does it properly.
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
  reactionCount = 0,
  reactionMine = false,
  reactionHidden = true,
  onToggleReaction,
}: CardProps) {

  const { t } = useTranslation('courses');
  const toPar = toParFor(row);
  const toParUnder =
    row.gross != null && row.course_par != null && row.gross - row.course_par < 0;

  /* THE SELECTOR IS PURE AND LIVES IN ITS OWN MODULE (§S1.8). A round with no
     hole data returns PLAIN with no counts. The SHAPE is still read for the
     moment — the eighteen marks and the curve now live in the sheet (§3.1). */
  const moment = useMemo(
    () => selectMoment(shape?.holes ?? [], row.course_record_fact),
    [shape, row.course_record_fact],
  );
  /* THE KICKER AND THE MOMENT SENTENCE COME OFF THE CARD (BRIEF_ROUND_CARD_
     STRIP_BACK §S2). momentLabel/momentSentence remain exported here and are
     now UNCALLED — reported, left in place rather than deleted blind, since the
     templates are the single home of the moment copy. */


  const delta = row.delta_index;
  const hasMovement =
    delta != null && Number.isFinite(delta) && Math.abs(delta as number) >= 0.05;



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
        {/* THE HERO'S OWN CONTENT BOX (BRIEF_ROUND_CARD_STRIP_BACK §S1).
            THE COURSE NAME PINS TO THE TOP, absolutely, with the when-chip on
            the same line at the right; THE FIGURE ANCHORS TO THE BOTTOM. They
            are in separate layers, so however long the course name runs it can
            never share a line with the figure — the collision Ben saw.
            THE KICKER AND THE MOMENT SENTENCE ARE GONE (§S2.1, §S2.2): the
            kicker said what the figure's noun already says, and the sentence
            restated the figure in words. */}
        <div
          style={{
            height: HERO_H,
            flexShrink: 0,
            position: 'relative',
            padding: '11px 12px 11px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
        <div
          style={{
            position: 'absolute',
            top: 11,
            left: 12,
            right: 12,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: DISCOVER_FACT,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {courseName ?? row.course_name ?? t('discover.golfThisWeek.unknownCourse', 'A course')}
          </div>
          <span
            style={{
              flex: 'none',
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

        {/* THE FIGURE AND ITS NOUN (§S3.1). The noun stays: a green 9 with no
            noun could be anything, and colour says THAT something is notable,
            never WHAT. The colour rule is unchanged (§S3.2). */}
        <FigureLine
          moment={moment}
          gross={row.gross ?? null}
          toParText={toPar?.text ?? null}
          t={t as TFn}
        />
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
                  /* FLOOR (item 2) — CONTENT-unchanged applies only to figures
                     already at or above 11. This one was below it. 10.5 -> 11. */
                  fontSize: 11,
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
                    /* FLOOR (item 2) — index delta lifted 10.5 -> 11. */
                    fontSize: 11,
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

      {/* ===================== THE FOOT (§2.1, §3.1) =====================
          THE SCORECARD BLOCK IS GONE FROM THE CARD, NOT FROM THE APP: the
          trajectory curve, the OUT/IN rows and the eighteen hole marks are all
          rendered by CardScorecardSheet, which this card already opens, so
          nothing moved — the card's copies simply went.
          THE FOOT IS PINNED TO THE BOTTOM (§S3.3) and holds ONLY the action
          row now: the reference line and its tier ladder are retired. */}
      <div
        style={{
          height: FOOT_H,
          marginTop: 'auto',
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '6px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* THE ACTION ROW (§2.1): SEE THE CARD leads, the reaction sits in the
            trailing slot. The control's 44px tap target is padding cancelled by
            a negative margin, so the foot is FOOT_H at every count — 0, 1 or 3
            digits — and every rail card stays the same height. */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              ...LABEL,
              fontSize: 11,
              color: DISCOVER_QUIET,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {t('discover.golfThisWeek.moment.seeTheCard', 'SEE THE CARD')}
            <ChevronRight size={9} strokeWidth={3} />
          </span>
          <ReactionSlot>
            <ReactionAction
              hidden={reactionHidden}
              count={reactionCount}
              reacted={reactionMine}
              onToggle={() => onToggleReaction?.()}
              label={t('discover.reactions.action', 'Like this round')}
            />
          </ReactionSlot>
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
  /**
   * BRIEF_DISCOVER_WORLD_CLASS §1.5 — the readout and the pills STAY WHERE THEY
   * ARE, beneath the hero. But the safe-area + chrome-island clearance lives in
   * this section's first row (MICRO_BRIEF_ROUNDS_SECTION_CHROME S1.4), and when
   * a full-bleed hero renders above it that hero owns the notch instead. False
   * drops the clearance to the ordinary section gap; nothing else moves.
   */
  chromeClearance?: boolean;
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
  chromeClearance = true,
  style,
}: Props) {
  const { t } = useTranslation('courses');
  /**
   * BRIEF_DISCOVER_THE_BOARD §2 — THE SELECTED board category. This is the
   * SELECTION only; what the board RENDERS is `activeBoard` below, which falls
   * back when a category has no qualifiers, and every label reads that instead
   * (§2.3). Component state, not URL: the scope pills answer "which rounds",
   * this answers "which board", and only the former is shareable today.
   */
  /**
   * BRIEF_BOARD_FIVE_CATEGORIES_AND_ROTATION §S2 — NULL MEANS "NOT CHOSEN YET",
   * and the rotation supplies the default. An EXPLICIT pick writes here and
   * therefore beats the rotation for the rest of the session (§2.3).
   */
  const [boardCategory, setBoardCategory] = useState<BoardKey | null>(null);
  /* ONE piece of state controls the category sheet, owned here because the
     control (the hero title) and the sheet render in different blocks. */
  const [pickerOpen, setPickerOpen] = useState(false);
  /* THE SCOPE FILTERS AT THE QUERY (§E): Top 100 and Played resolve to a course
     allow-list that goes into SQL. `undefined` means not yet resolved. */
  const scopeCourses = useWeekScopeCourses(userId, scope);
  const roundsQuery = useGolfThisWeek(userId, scope, scopeCourses.courseIds);
  const all = roundsQuery.data ?? [];
  /* §2.2b — THE SAME INDEX SOURCE AS THE HANDICAP BAND: eg_handicap_index with
     manual_handicap_index as the fallback. Read here (before any early return)
     so the rotation can lean on it; a null index is a valid answer (§2.2c). */
  const viewerIndex = useViewerHandicapIndex(userId).index;

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

  /* NET (BRIEF_BOARD_LOWEST_NET §S1): ONE read of gam_round_net for the whole
     window, keyed on the SAME whs_score_id set the hole shapes and reactions
     already use, so the map joins straight onto the rows the board holds. */
  const netByScore = useRoundNetScores(scoreIds);

  /* REACTIONS (BRIEF_GOLF_THIS_WEEK_P2 §S1): ONE batched read for the whole
     visible window, keyed by the round's whs_score id exactly as
     FriendsPlayedRail does — content_reactions is canonical for rounds, so the
     same round reads identically in both sections. Rounds without a score id
     contribute no target and render no control. */
  const reactionTargets = useMemo<ReactionTarget[]>(
    () =>
      ordered
        .filter((r) => !!r.score_id)
        .map((r) => ({ type: 'round' as const, id: r.score_id as string })),
    [ordered],
  );
  const reactions = useContentReactions(reactionTargets);


  /* THE PERSONAL-HISTORY READ IS GONE (BRIEF_ROUND_CARD_STRIP_BACK §S2.3/§2.4).
     The batched get_my_course_bests hook and the shared tier ladder are no
     longer consumed by this surface; the board above does the comparing. The
     code is DELETED rather than left behind a false conditional. */

  /* NO INSIGHT MAP. The tile's prose is the MOMENT SENTENCE, generated from a
     fixed template per kind inside the card (BRIEF_ROUND_TILE_THE_MOMENT §S4.3).
     buildInsightMap survives for the see-all sheet, which still renders rows. */


  const pending = !!userId && (roundsQuery.isPending || !scopeCourses.ready);
  if (pending) return <GolfThisWeekShell />;

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

  /**
   * §1.1 — RANK OVER THE FULL LIST. The dedupe-and-keep-best pass now returns
   * EVERY qualifying member in order; `topThree` is a slice of it. The pinned
   * own-member row needs a rank that can be 9th, and a top three cannot supply
   * one. Because the array is deduped by user_id the member appears at most
   * once, and that entry is already their best qualifying round (§1.2).
   */
  const rankAll = (rows: CircleRoundRow[]) => {
    const seen = new Set<string>();
    const out: CircleRoundRow[] = [];
    for (const r of rows) {
      if (seen.has(r.user_id)) continue;
      seen.add(r.user_id);
      out.push(r);
    }
    return out;
  };
  /** §2 — one place per member, best kept, at most three places. */
  /** §2 — one place per member, best kept, at most three places. */
  const topThree = (rows: CircleRoundRow[]) => rankAll(rows).slice(0, 3);
  void topThree;



  /* THE FLOORS APPLY TO EVERY PLACE (§3): a runner-up clears the same floor as
     the winner, so a tile with one qualifier shows the hero and NOTHING else —
     no second row, no dash, no placeholder. That is a normal week. */
  const bestRanked = rankAll(
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

  /* LOWEST NET (BRIEF_BOARD_LOWEST_NET §S2, superseding
     BRIEF_BOARD_FIVE_CATEGORIES_AND_ROTATION §1.1). The net comes from the
     gam_round_net VIEW, joined on whs_score_id — NOT from the row's own `net`,
     which derives from whs_scores.course_handicap, a column the England Golf
     sync has never populated (null on every row ever recorded), so that board
     could never hold a single qualifier.
     THE FLOOR IS THE FIELD ITSELF: a round with no net_score DOES NOT QUALIFY
     (§2.2) — it is never defaulted and never substituted with gross. Roughly 4%
     of rounds have no net because the course has no slope, rating or par.
     NO WHS ARITHMETIC HERE (§3.1/§3.2): the formula lives once, in
     whs_course_handicap. Lower wins. */
  const netOf = (r: CircleRoundRow) =>
    (r.score_id ? netByScore.get(r.score_id)?.net : undefined) ?? null;
  const netRanked = rankAll(
    ordered
      .filter((r) => netOf(r) != null)
      .sort((a, b) => (netOf(a) as number) - (netOf(b) as number) || byDateDesc(a, b)),
  );

  const improvedRanked = rankAll(
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
  const stablefordRanked = rankAll(
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
  const birdiesRanked = rankAll(
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

  /* ================= THE BOARD (BRIEF_DISCOVER_THE_BOARD §S1) ==============
     THE TWO SIDE-BY-SIDE BAND TILES ARE GONE. Discover holds the same shape of
     data as the tour overview — a field of members over fourteen days — and now
     renders it the same way: ONE ranked table for ONE selected category, with
     positions, columns and a header strip.

     NOTHING ABOUT THE DATA CHANGED (§1.2): bestRanked / stablefordRanked /
     birdiesRanked are the SAME ranked, member-deduped arrays with the SAME
     floors (Stableford >= 36, birdies >= 3). No new query, no new sort.

      FIVE CATEGORIES NOW (BRIEF_BOARD_FIVE_CATEGORIES_AND_ROTATION §S1): lowest
     net and most improved join, because gross and birdies both reward
     ball-striking and the board read as weighted to low handicaps. Net,
     Stableford and improved are winnable by anyone. FEWEST BLOW-UPS was
     proposed and REJECTED — do not add it (§1.3). */
  void best;

  interface BoardSpec {
    key: BoardKey;
    /** §4.1 — the hero title, and the sheet row. */
    label: string;
    /** §2.2 — the island capsule's short form. */
    short: string;
    /** §1.6 — the VALUE column's header. */
    unit: string;
    /**
     * §1.6 — THE FOURTH COLUMN ONLY EXISTS WHERE A QUALIFIER EXISTS. Gross
     * carries its TO-PAR there; net carries the GROSS the net came from, so a
     * member reads 68 net against 88 gross, and it is TONED BY THE SAME TO-PAR
     * COLOUR LAW so the law still applies to both scoring boards. Stableford,
     * improved and birdies have no qualifier, so the column AND its header are
     * absent and the grid is one column shorter. Decided ONCE per render at
     * table level (this flag), never per row.
     */
    hasPar: boolean;
    /** The fourth column's header where hasPar. */
    parHeader?: string;
    /** The fourth column's cell where hasPar. */
    parCell?: (r: CircleRoundRow) => { text: string; tone: string } | null;
    /** §1.2 — the existing ranked list, untouched. */
    ranked: CircleRoundRow[];
    /**
     * §1.5 — DERIVED, NOT HARD-CODED: gross and net are lower-wins, the other
     * three are higher-is-better in their own terms. The pinned row's gap
     * direction and unit read from this.
     */
    lowerWins: boolean;
    valueOf: (r: CircleRoundRow) => number;
    /** The VALUE cell's text. */
    format: (r: CircleRoundRow) => string;
    precision: number;
    /** The unit the pinned row's gap carries. */
    offUnit: 'shots' | 'points' | 'birdies' | 'cut';
  }

  /** §1.5 — the one place the direction is stated; every spec derives from it. */
  const LOWER_WINS: BoardKey[] = ['gross', 'net'];

  /**
   * §3.1/§3.2 — THE TO-PAR COLOUR LAW, as scoreColor.ts states it and as the
   * tour board already renders it: UNDER PAR IS RED, OVER PAR IS THE NEUTRAL
   * FACT INK, LEVEL PAR IS MUTED. +4, +5 and +6 are NOT red.
   *
   * THE DARK RED, not TOPAR_RED (#C8102E): these figures sit on A.PANEL, where
   * the light-surface red goes muddy at 12.5px.
   */
  const toParOf = (r: CircleRoundRow) => {
    if (r.gross == null || r.course_par == null) return null;
    const d = (r.gross as number) - (r.course_par as number);
    return {
      text: d === 0 ? 'E' : d < 0 ? `\u2212${Math.abs(d)}` : `+${d}`,
      tone: d < 0 ? ROW_DARK_TOPAR_UNDER : d > 0 ? DISCOVER_FACT : A.MUTE,
    };
  };

  const boards: BoardSpec[] = [
    {
      key: 'gross',
      label: t('discover.golfThisWeek.board.grossLabel', 'Lowest gross'),
      short: t('discover.golfThisWeek.board.grossShort', 'GROSS'),
      unit: t('discover.golfThisWeek.board.grossUnit', 'GROSS'),
      hasPar: true,
      parHeader: t('discover.golfThisWeek.board.par', 'PAR'),
      parCell: toParOf,
      ranked: bestRanked,
      lowerWins: LOWER_WINS.includes('gross'),
      valueOf: (r) => r.gross as number,
      format: (r) => String(r.gross ?? '\u2014'),
      precision: 0,
      offUnit: 'shots',
    },
    {
      /* LOWEST NET (BRIEF_BOARD_LOWEST_NET §2.3/§2.4). Ranked on gam_round_net's
         net_score; the GROSS rides in the fourth column under a GROSS header so
         67 net reads against the 79 it came from. */
      key: 'net',
      label: t('discover.golfThisWeek.board.netLabel', 'Lowest net'),
      short: t('discover.golfThisWeek.board.netShort', 'NET'),
      unit: t('discover.golfThisWeek.board.netUnit', 'NET'),
      hasPar: true,
      parHeader: t('discover.golfThisWeek.board.netSecondary', 'GROSS'),
      parCell: (r) =>
        r.gross == null ? null : { text: String(r.gross), tone: toParOf(r)?.tone ?? A.MUTE },
      ranked: netRanked,
      lowerWins: LOWER_WINS.includes('net'),
      valueOf: (r) => netOf(r) as number,
      format: (r) => String(netOf(r) ?? '\u2014'),
      precision: 0,
      offUnit: 'shots',
    },
    {
      key: 'stableford',
      label: t('discover.golfThisWeek.board.stablefordLabel', 'Stableford'),
      short: t('discover.golfThisWeek.board.stablefordShort', 'STABLEFORD'),
      unit: t('discover.golfThisWeek.board.stablefordUnit', 'PTS'),
      hasPar: false,
      ranked: stablefordRanked,
      lowerWins: LOWER_WINS.includes('stableford'),
      valueOf: (r) => r.stableford_points as number,
      format: (r) => String(r.stableford_points),
      precision: 0,
      offUnit: 'points',
    },
    {
      /* §1.2 — MOST IMPROVED reuses improvedRanked EXACTLY as it stands: the
         floor is "a cut only" (delta_index < 0) and the biggest cut leads. The
         FIGURE IS THE ABSOLUTE CUT to one decimal, so -1.4 shows as 1.4. */
      key: 'improved',
      label: t('discover.golfThisWeek.board.improvedLabel', 'Most improved'),
      short: t('discover.golfThisWeek.board.improvedShort', 'IMPROVED'),
      unit: t('discover.golfThisWeek.board.improvedUnit', 'CUT'),
      hasPar: false,
      ranked: improvedRanked,
      lowerWins: LOWER_WINS.includes('improved'),
      /* Higher-is-better IN ITS OWN TERMS: the bigger the cut, the better, so
         the value is the ABSOLUTE cut and the comparison needs no sign. */
      valueOf: (r) => Math.abs(r.delta_index as number),
      format: (r) => Math.abs(r.delta_index as number).toFixed(1),
      precision: 1,
      offUnit: 'cut',
    },
    {
      key: 'birdies',
      label: t('discover.golfThisWeek.board.birdiesLabel', 'Most birdies'),
      short: t('discover.golfThisWeek.board.birdiesShort', 'BIRDIES'),
      unit: t('discover.golfThisWeek.board.birdiesUnit', 'BIRDIES'),
      hasPar: false,
      ranked: birdiesRanked,
      lowerWins: LOWER_WINS.includes('birdies'),
      valueOf: (r) => r.birdies as number,
      format: (r) => String(r.birdies),
      precision: 0,
      offUnit: 'birdies',
    },
  ];

  /**
   * §2.3/§4.3 — ONE VALUE, HOISTED. The board that is ACTUALLY RENDERED is
   * resolved here, once, and the island capsule, the hero title and the column
   * header all read it. A stale or empty selection FALLS BACK, and the labels
   * fall back with it — the tour picker's fault (a label derived from a
   * selection rather than from the list on screen) cannot recur.
   */
  /**
   * BRIEF_BOARD_FIVE_CATEGORIES_AND_ROTATION §S2 — THE ROTATED DEFAULT, chosen
   * ONCE PER SESSION and held in the module-level `sessionBoardKey`. The weight
   * order is the brief's: (a) categories where the VIEWER HAS A QUALIFYING ROUND
   * first — the same test the pinned row uses — (b) among those, lean on the
   * handicap index, (c) qualifying nowhere or no index, choose from all five,
   * (d) NEVER a category with no ranked rows at all.
   *
   * WHY IT IS NOT REACT STATE: a mount-scoped default would reshuffle the page
   * every time the member tabs away from Discover and back (§2.1). WHY IT IS NOT
   * STORAGE: the rotation must NOT persist across a cold launch (§2.4).
   */
  if (sessionBoardKey == null) {
    const nonEmpty = boards.filter((b) => b.ranked.length > 0);
    if (nonEmpty.length > 0) {
      const qualifying = userId
        ? nonEmpty.filter((b) => b.ranked.some((r) => r.is_self))
        : [];
      let pool = qualifying.length > 0 ? qualifying : nonEmpty;
      if (qualifying.length > 0 && viewerIndex != null) {
        const lean = viewerIndex < 5 ? LOW_INDEX_LEAN : HIGH_INDEX_LEAN;
        const leaning = qualifying.filter((b) => lean.includes(b.key));
        if (leaning.length > 0) pool = leaning;
      }
      sessionBoardKey = pool[Math.floor(Math.random() * pool.length)].key;
    }
  }

  /**
   * §2.3/§4.3 — ONE VALUE, HOISTED. The board that is ACTUALLY RENDERED is
   * resolved here, once, and the island capsule, the hero title and the column
   * header all read it. A stale or empty selection FALLS BACK, and the labels
   * fall back with it — the tour picker's fault (a label derived from a
   * selection rather than from the list on screen) cannot recur.
   *
   * §2.3 — AN EXPLICIT PICK (`boardCategory`) BEATS THE ROTATION; with no pick
   * yet the session's rotated key stands in.
   */
  const effectiveCategory: BoardKey | null = boardCategory ?? sessionBoardKey;
  const activeBoard =
    boards.find((b) => b.key === effectiveCategory && b.ranked.length > 0) ??
    boards.find((b) => b.ranked.length > 0) ??
    null;

  /**
   * §1.4 — POSITIONS WITH TIES. Standard competition ranking over the full
   * ranked list; equal values share a position and take the T prefix, exactly
   * as the band tiles printed T3.
   *
   * THE RULE: 1, T2, T2, 4 — two players tied for second means two people have
   * finished ahead of the next player, so there is no third place. This was
   * QUESTIONED AND CONFIRMED CORRECT; it is what the tour leaderboard in this
   * app does. Do not "fix" it to 1, T2, T2, 3.
   */
  const positionsFor = (b: BoardSpec) => {
    const out: string[] = [];
    let pos = 1;
    b.ranked.forEach((r, i) => {
      if (i > 0 && b.valueOf(r) !== b.valueOf(b.ranked[i - 1])) pos = i + 1;
      out.push(String(pos));
    });
    const tally = new Map<string, number>();
    out.forEach((p) => tally.set(p, (tally.get(p) ?? 0) + 1));
    return out.map((p) => ((tally.get(p) ?? 0) > 1 ? `T${p}` : p));
  };

  /**
   * §1.5 — THE PINNED ROW'S GAP TO THE LEADER, unchanged in behaviour. The
   * DIRECTION IS DERIVED from `lowerWins`, never hard-coded: (own − leader) on a
   * lower-wins board, (leader − own) everywhere else. Both are positive for a
   * member behind the leader, which is the only case a pinned row exists in.
   */
  const pinnedGap = (b: BoardSpec, own: CircleRoundRow) => {
    const leaderValue = b.valueOf(b.ranked[0]);
    const ownValue = b.valueOf(own);
    const signed = b.lowerWins ? ownValue - leaderValue : leaderValue - ownValue;
    const gap = Number(Math.abs(signed).toFixed(b.precision));
    if (gap === 0) return t('discover.golfThisWeek.gap.tied', 'TIED');
    if (b.offUnit === 'shots') {
      return t('discover.golfThisWeek.gap.shotsOff', '{{count}} SHOTS OFF', { count: gap });
    }
    if (b.offUnit === 'points') {
      return t('discover.golfThisWeek.gap.pointsOff', '{{count}} POINTS OFF', { count: gap });
    }
    if (b.offUnit === 'cut') {
      /* MOST IMPROVED: the gap is in STROKES OF CUT, one decimal, so the unit
         cannot be read as a score. */
      return t('discover.golfThisWeek.gap.cutOff', '{{count}} OFF THE LEAD', { count: gap });
    }
    return t('discover.golfThisWeek.gap.birdiesOff', '{{count}} BIRDIES OFF', { count: gap });
  };

  const courseNameFor = (r: CircleRoundRow) =>
    (r.course_id ? meta?.get(r.course_id)?.name : null) ??
    r.course_name ??
    t('discover.golfThisWeek.unknownCourse', 'Unknown course');

  /* §1.4 — ONE GRID DEFINITION, derived from the PAR flag (§1.6). Header strip,
     every row and the pinned row all read this single string. */
  const BOARD_GRID = activeBoard?.hasPar
    ? '30px minmax(0, 1fr) 40px 34px'
    : '30px minmax(0, 1fr) 40px';



  /**
   * BRIEF_DISCOVER_BOARD_LEADS §1.3 — THE HERO'S PHOTOGRAPH IS THE LEADER'S
   * COURSE. The board leads with that row, so the picture describes it, and it
   * CHANGES WITH THE CATEGORY because the leader does. No new fetch: the URL
   * comes out of `meta`, the batched course read the rows already resolve.
   */
  const heroLeader = activeBoard?.ranked[0] ?? null;
  const heroCourseId = heroLeader?.course_id ?? null;
  const heroImage = heroCourseId ? meta?.get(heroCourseId)?.imageUrl ?? null : null;
  /* §1.3 — UNRESOLVED IS NOT ABSENT. While the course read is in flight the hero
     holds a NEUTRAL SHELL: never the gradient first and the photograph second,
     which is the swap the app's standing loading rule forbids. Once settled, a
     course with no image resolves to the canonical course gradient. */
  const heroImagePending = !!heroCourseId && metaQuery.isPending;

  return (
    <section style={style}>
      {/* THE BOARD'S HERO — the SAME photo hero as Tour Overview. Height,
          gradient base, photo focal point, canon scrim and lower-third type all
          come from PhotoBand so the two surfaces read as one treatment. THREE
          THINGS ONLY — the category title, the counts, the when chip.
          FULL-BLEED: it escapes the page's 14px gutter and starts at physical
          y=0, paying the notch and the floating island clearance itself. */}
      {activeBoard ? (
        <div
          style={{
            position: 'relative',
            width: '100dvw',
            marginLeft: 'calc(50% - 50dvw)',
            /* MICRO_BRIEF_BOARD_HERO_CHIP_AND_RAIL §3.1 — the board hero is
               pinned at EXACTLY 246 (plus the notch inset it absorbs) so the
               hairline and the stat rail have room and nothing below moves.
               This is a LOCAL height: the tour's PHOTO_BAND_HEIGHT stays where
               it is and is no longer the term here. */
            height: `calc(${BOARD_HERO_HEIGHT}px + env(safe-area-inset-top, 0px))`,
            marginBottom: 14,
            overflow: 'hidden',
            isolation: 'isolate',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* PhotoBand's LAYERING, exactly: base gradient, photo, one canon
              ramp. The base gradient is ALWAYS painted (a pending course read
              no longer swaps a flat shell in for it — the photograph fades over
              the same ground the tour hero uses), and the ramp is always on, so
              the lower-third type has the same legibility ground at every
              state. */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: COURSE_GRADIENT, zIndex: -2 }}
          />
          {!heroImagePending && heroImage && (
            <img
              src={heroImage}
              alt=""
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
          {/* THE ONE CANON SCRIM — a 260px bottom ramp, the same ramp and the
              same height PhotoBand paints. Per the canon it terminates on what
              sits beneath it — the Discover canvas — so there is no seam where
              the hero meets the scope pills. */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 260,
              background: heroCanonScrimOn(CHARCOAL),
              zIndex: -1,
            }}
          />


          {/* THE WHEN CHIP, top-right (§1.1), on the same notch + island
              clearance the section's first row used to pay. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: 'calc(env(safe-area-inset-top, 0px) + 70px) 20px 0',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: BOARD_HERO_FAINT,
              }}
            >
              {t('discover.golfThisWeek.board.whenChip', 'LAST {{days}} DAYS', {
                days: GOLF_WEEK_DAYS,
              })}
            </span>
          </div>

          {/* THE LOWER THIRD — PhotoBand's column: 20px gutters, 8px off the
              bottom edge, 10px between the title and the line beneath it. */}
          {/* gap 0: the hairline and the rail own their own top margins (11 and
              10) so the vertical rhythm is stated once, in one place. */}
          <div style={{ padding: '0 20px 8px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* THE CATEGORY NAMES ITSELF ONCE ON THE PAGE, HERE, as a caps
                masthead — 21/800 with 0.06em tracking and the broadcast text
                shadow. Read from `activeBoard`, never from the selection.

                MICRO_BRIEF_BOARD_PICKER_ON_TITLE: the title IS the control. The
                chevron carries the affordance — no pill, no background, no
                underline. The 44px hit height comes from padding plus a matching
                negative margin, so the visual position of the title and the
                counts line beneath it is unchanged. */}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              aria-label={t('discover.golfThisWeek.board.pickerAria', 'Change board: {{label}}', {
                label: activeBoard.label,
              })}
              className="active:scale-[0.97]"
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 12px 12px 0',
                margin: '-12px -12px -12px 0',
                minHeight: 44,
                textAlign: 'left',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: SANS,
                  fontSize: 21,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: DISCOVER_FACT,
                  textShadow: '0 2px 12px rgba(0,0,0,0.55)',
                }}
              >
                {activeBoard.label}
              </h2>
              {/* §S1 — THE CHIP. A 26px circular glass chip, this app's
                  existing icon-button shape. The chevron inside is FACT ink:
                  inside a container it is an icon, not a hint. The title itself
                  carries no border, background or underline — the whole
                  title-and-chip group is the control. */}
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                }}
              >
                <ChevronDown size={12} strokeWidth={2.6} color={DISCOVER_FACT} />
              </span>
            </button>

            {/* §S2 — THE STAT RAIL. A hairline separates, so the pairs carry no
                dot between them. The labels are caps because they are labels;
                the figures stay figures and are tabular so the rail cannot
                reflow when 9 becomes 10.
                NOTE: ROUNDS and COURSES are counts, DAYS is the WINDOW —
                GOLF_WEEK_DAYS, a constant. It sits here because it is what makes
                the other two mean anything. Do not make it dynamic. */}
            <div
              aria-hidden
              style={{
                marginTop: 11,
                height: 1,
                background: 'rgba(255,255,255,0.18)',
                width: '100%',
              }}
            />
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'baseline',
                gap: 18,
                minWidth: 0,
              }}
            >
              {[
                {
                  key: 'rounds',
                  figure: counts.rounds,
                  label: t('discover.golfThisWeek.board.railRounds', 'ROUNDS'),
                },
                {
                  key: 'courses',
                  figure: counts.courses,
                  label: t('discover.golfThisWeek.board.railCourses', 'COURSES'),
                },
                {
                  key: 'days',
                  figure: GOLF_WEEK_DAYS,
                  label: t('discover.golfThisWeek.board.railDays', 'DAYS'),
                },
              ].map((pair) => (
                <div
                  key={pair.key}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0 }}
                >
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: SANS,
                      fontSize: 15,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: DISCOVER_FACT,
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {pair.figure}
                  </span>
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 9.5,
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: BOARD_HERO_FAINT,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pair.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* NO QUALIFYING BOARD — no category to name, so no hero. The clearance
           the hero pays still has to come from somewhere, so this row pays it
           and nothing else. */
        <div
          aria-hidden
          style={{
            height: chromeClearance ? 'calc(env(safe-area-inset-top, 0px) + 70px)' : 0,
          }}
        />
      )}


      {/* SCOPE PILLS AND THE REGION WELL — one row beneath the readout. Per
          BRIEF_DISCOVER_PILL_PEEK the well FLOATS OVER THE SCROLLER'S LEFT EDGE
          rather than sitting beside it: the scroller keeps the full row width and
          the scrollable CONTENT is padded clear of the well, so the right-hand
          cut lands deep inside a pill instead of in a gap. The peek is therefore
          structural — the padding moves the cut point by a fixed amount whatever
          the pill widths turn out to be — not tuned to one viewport or language.
          THE WELL IS OPAQUE IN BOTH STATES — A.PANEL collapsed, an opaque #36373E
          when a region is selected — and the selected tint must NEVER be
          reintroduced as an alpha. Opacity alone was not enough, though: a hard
          opaque edge reads as a pill SLIDING BEHIND A PANEL rather than
          disappearing, so A SOLID MASK RUNS 8px PROUD of the well
          (BRIEF_DISCOVER_HERO_SCORE_AND_FILTER_ROW §3) and a pill is fully
          invisible BEFORE it reaches the control. The mask feathers only so it
          has no visible edge of its own — it is not a fade and not a scroll cue.
          The well and the mask both STRETCH to this row's height (alignItems
          stretch below) so no sliver can show above or below either. */}

      <div style={{ position: 'relative', marginBottom: 12, minWidth: 0 }}>
        <WeekScopePills
          scope={scope}
          onChange={(s) => onScopeChange?.(s)}
          userId={userId}
          /* THE COUPLING IS IN CODE, NOT ONLY IN A COMMENT (§3.5): paddingLeft is
             DERIVED from the same constants the mask uses, so the 8px proud edge
             always lands on the gap between the well and the first pill. Widen the
             gap and the mask no longer reaches the first pill's resting position;
             narrow it and the SELECTED pill starts under the mask, breaking the
             rule that the selected pill is never the hidden one. paddingRight 16
             lets the last pill scroll clear of the right edge rather than ending
             flush against it. No flex here — the scroller is this wrapper's only
             flow child. */
          style={{ minWidth: 0, paddingLeft: PILL_ROW_PADDING_LEFT, paddingRight: 16 }}
        />
        {/* THE FADE IS A SCROLL CUE, NOT A MASK: nothing sits behind the right
            edge now, so the final stop is 100% and the peeking pill SOFTENS into
            the edge instead of being flatly painted out at 90%. The transparent
            stop is A.CANVAS at zero alpha, never `transparent`, which some
            engines resolve as a grey haze. It renders BEFORE the well in DOM
            order so it can never paint over it. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: 24,
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(21,23,31,0) 0%, #15171F 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            display: 'flex',
            /* THE WRAPPER IS NOW WIDER THAN THE CONTROL (it also holds the mask),
               so it must not swallow taps meant for the pills scrolling beneath:
               it is pointer-transparent and the dropdown re-enables events for
               itself. */
            pointerEvents: 'none',
            /* STRETCH, NOT CENTRE: this wrapper spans top 0 to bottom 0, so its
               height is the pill row's height and BOTH the trigger and the mask
               inherit it. No fixed pixel height anywhere — a number would
               silently rot the day pill type or padding moves. */
            alignItems: 'stretch',
          }}
        >

          <RegionDropdown
            regions={regions}
            selection={region}
            onChange={(sel) => onRegionChange?.(sel)}
            style={{ pointerEvents: 'auto' }}
          />

          {/* THE MASK IS A FLEX SIBLING OF THE WELL, NOT A FIXED-WIDTH OVERLAY
              (§3.1). THE WELL IS NOT A FIXED 46px: collapsed it is pin plus
              chevron, and with a region selected it grows to fit the label. A mask
              sized from a constant would be NARROWER than the well in exactly the
              state where a pill showing through is most visible. As a sibling the
              solid stop always begins at the well's ACTUAL right edge — no
              measurement, no ResizeObserver. The transparent stop is the canvas at
              zero alpha, never `transparent`. No backdrop-filter: this paints the
              canvas colour; a blur would still show the pill's shape and would
              cost a compositing layer on a scrolling row. */}
          {/* FULLY OPAQUE, NO FEATHER: a gradient tail let the leading edge of a
              scrolling pill show through as a ghost. The mask paints the exact
              canvas colour, so its own right edge is invisible against the
              canvas while a pill passing under it is hidden outright. */}
          <div
            aria-hidden
            style={{
              flex: 'none',
              width: MASK_PROUD + MASK_FEATHER,
              pointerEvents: 'none',
              background: '#15171F',
            }}
          />

        </div>
      </div>




      {/* AN HONEST EMPTY ANSWER (§S2.5): the filters stay, the sentence explains. */}
      {ordered.length === 0 && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: DISCOVER_QUIET,
            fontFamily: SANS,
            padding: '10px 0 0',
          }}
        >
          {t(scopeEmptyKey(scope).key, scopeEmptyKey(scope).fallback)}
        </div>
      )}

      {/* ==================== THE BOARD (§S1) ====================
          ONE ranked table for the category the picker selected, six rows deep,
          plus the pinned viewer row. Every row opens that member's scorecard —
          the same sheet the round cards open.

          §1.3 — THERE IS NO "FULL LEADERBOARD" ROW. No destination exists for
          these categories: the only see-all surface on this section is
          GolfThisWeekSheet, which is a DATE-GROUPED LIST OF ROUNDS, not a ranked
          board for a category — pointing a row labelled FULL LEADERBOARD at it
          would lie about where it goes. Per the brief's own instruction the row
          is REPORTED and not built; a category leaderboard destination is its
          own brief. The See all rounds action below the cards is untouched. */}
      {activeBoard && activeBoard.ranked.length > 0 && (() => {
        const board = activeBoard;
        const positions = positionsFor(board);
        /* FIVE RANKED ROWS, NEVER SIX. Five plus at most one pinned row keeps
           the board to six rows total so the pinned row cannot fall below the
           fold on a small phone. */
        const rows = board.ranked.slice(0, 5);
        const selfIdx = userId ? board.ranked.findIndex((r) => r.is_self) : -1;
        /* THE THREE NO-PIN STATES: already inside the visible five (marked in
           place in full amber instead), no qualifying round in the window
           (findIndex === -1), and signed out (selfIdx forced to -1 above).
           Marking in place and pinning are alternatives, never both. */
        const pinned = selfIdx >= 5 ? board.ranked[selfIdx] : null;

        const headCell = (text: string, align: 'left' | 'center' | 'right') => (
          <span
            style={{
              /* AXIS 10 — a column header is a coordinate, not language. */
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BAND_FAINT,
              textAlign: align,
            }}
          >
            {text}
          </span>
        );

        return (
          <>
            {/* THE CATEGORY SHEET, opened by the hero title. Its `category` is
                the value the board is RENDERING, never the raw selection. */}
            <BoardPicker
              open={pickerOpen}
              onClose={() => setPickerOpen(false)}
              category={board.key}
              options={boards.map((b) => ({
                key: b.key,
                label: b.label,
                short: b.short,
                subtitle: t('discover.golfThisWeek.board.pickerRowSub', '{{count}} in the field', {
                  count: b.ranked.length,
                }),
                count: b.ranked.length,
              }))}
              onSelect={(k) => setBoardCategory(k as BoardKey)}
              sheetEyebrow={t('discover.golfThisWeek.board.pickerEyebrow', 'Discover')}
              sheetTitle={t('discover.golfThisWeek.board.pickerTitle', 'Select board')}
            />

            <div
              data-discover-board={board.key}
              /* FULL-BLEED, like the tour's leaderboard block: the board is the
                 page's spine, not a card on it. It escapes the page gutter, drops
                 the radius and the shadow, and keeps its own 20px column so its
                 rows line up with the hero's lower third. */
              style={{
                width: '100dvw',
                marginLeft: 'calc(50% - 50dvw)',
                 /* CANVAS, not PANEL. The tour's leaderboard block sits on the
                    canvas (#15171F) — the exact stop the hero scrim ends on — so
                    the hero fades INTO the board with no seam. A.PANEL (#1B1E27)
                    read as a charcoal slab floating on the page. */
                 background: A.CANVAS,
                borderTop: `1px solid ${WELL_RULE}`,
                overflow: 'hidden',
                marginBottom: 12,
                fontFamily: SANS,
              }}
            >
              {/* THE HEADER STRIP (§1.6). The PAR header is absent wherever the
                  PAR column is — one flag, one grid, decided at table level. */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: BOARD_GRID,
                  alignItems: 'center',
                  columnGap: 8,
                  padding: '8px 20px',
                  borderBottom: `1px solid ${WELL_RULE}`,
                }}
              >
              {headCell(t('discover.golfThisWeek.board.pos', 'POS'), 'center')}
                {headCell(t('discover.golfThisWeek.board.member', 'MEMBER'), 'left')}
                {headCell(board.unit, 'center')}
                {board.hasPar
                  ? headCell(
                      board.parHeader ?? t('discover.golfThisWeek.board.par', 'PAR'),
                      'center',
                    )
                  : null}
              </div>

              {/* `own` drives the AMBER TREATMENT and is true wherever the
                  viewer appears — in the ranked five or pinned. The NAME is
                  resolved identically in both cases (`r.display_name`);
                  `pinnedRow` only switches the SUB-LINE to the gap text. */}
              {[...rows.map((r, i) => ({
                  r,
                  pos: positions[i],
                  own: !!userId && !!r.is_self,
                  pinnedRow: false,
                })),
                ...(pinned
                  ? [{ r: pinned, pos: positions[selfIdx], own: true, pinnedRow: true }]
                  : []),
              ].map(({ r, pos, own, pinnedRow }) => {
                const tp = board.hasPar ? (board.parCell ?? toParOf)(r) : null;
                return (
                  <div
                    key={pinnedRow ? `you-${r.round_id}` : r.round_id}
                    data-board-row={own ? 'you' : 'member'}
                    role="button"
                    tabIndex={0}
                    onClick={() => onCardPress(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                        e.preventDefault();
                        onCardPress(r);
                      }
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: BOARD_GRID,
                      alignItems: 'center',
                      columnGap: 8,
                      padding: '8px 20px',
                      borderBottom: `1px solid ${WELL_RULE}`,
                      /* §1.5 — THE PINNED ROW IS A ROW IN THIS TABLE, same grid
                         and same columns, distinguished by COLOUR ONLY. */
                      background: own ? AMBER_WASH : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        textAlign: 'center',
                        color: own ? AMBER : BAND_FAINT,
                      }}
                    >
                      {pos}
                    </span>

                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}
                    >
                      <SquircleAvatar
                        src={r.profile_photo_url}
                        userId={r.user_id}
                        alt={r.display_name}
                        size={26}
                        hairlineRing
                        ringColor={DARK_HAIRLINE}
                      />
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 13.5,
                            fontWeight: 700,
                            lineHeight: 1.1,
                            color: own ? AMBER : INK,
                          }}
                        >
                          {r.display_name}
                        </span>
                        {/* On the pinned row the sub-line is the GAP TO THE
                            LEADER with its per-category unit and derived
                            direction (§1.5); on every other row it is WHERE. */}
                        <span
                          className={pinnedRow ? 'tabular-nums' : undefined}
                          style={{
                            display: 'block',
                            marginTop: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 11,
                            fontWeight: pinnedRow ? 700 : 600,
                            lineHeight: 1.1,
                            letterSpacing: pinnedRow ? '0.06em' : undefined,
                            color: own ? AMBER : BAND_FAINT,
                          }}
                        >
                          {pinnedRow ? pinnedGap(board, r) : courseNameFor(r)}
                        </span>
                      </span>
                    </span>

                    <span
                      className="tabular-nums"
                      style={{
                        ...NUMF,
                        fontSize: 15,
                        fontWeight: 700,
                        textAlign: 'center',
                        /* §3.3 — THE VALUE IS NOT A TO-PAR. A gross, a points
                           total and a birdie count are neutral facts on a board:
                           the band tiles painted the whole gross line GOLD even
                           when the winning round was +3, and the birdie count
                           red, both of which read as "under par" on a surface
                           where red MEANS under par. Both are gone. */
                        color: own ? AMBER : DISCOVER_FACT,
                      }}
                    >
                      {board.format(r)}
                    </span>

                    {board.hasPar ? (
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          textAlign: 'center',
                          /* §3.4 — AMBER OUTRANKS THE SCORE COLOUR on the
                             viewing member's row, including its to-par. */
                          color: own ? AMBER : tp?.tone ?? A.MUTE,
                        }}
                      >
                        {tp?.text ?? '\u2014'}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}





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
              /* §S1.2/§2.4 — target is the whs_score id, and the control renders
                 on your OWN round too (the trigger already skips self-notify). */
              reactionCount={reactions.stateFor('round', r.score_id).count}
              reactionMine={reactions.stateFor('round', r.score_id).mine}
              reactionHidden={!r.score_id || !reactions.viewerId || reactions.unavailable}
              onToggleReaction={() => reactions.toggle('round', r.score_id)}


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
