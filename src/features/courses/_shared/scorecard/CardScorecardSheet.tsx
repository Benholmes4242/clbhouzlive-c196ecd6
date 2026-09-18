import { FIELD_MIN_PLAYERS } from '@/lib/gam/fieldGate';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { ScorecardGlassOverlay } from './ScorecardGlassOverlay';
import { RoundEngagementActions } from '@/components/explore-tab-new/courseled/RoundEngagementActions';
import {
  honoursGround,
  METAL_GOLD,
  METAL_HAIRLINE,
  METAL_INK,
  METAL_TOP_EDGE,
  type HonoursFeat,
} from './honoursTreatment';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp } from '@/lib/formatHcp';
import { formatOrdinal } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  A, SANS, FIGS, Panel, Action,
} from '@/features/courses/components/holes/analytical/tokens';
/**
 * BRIEF_ROUND_SHEET_PEEK §1 — THE SHARED PARTS.
 * The type roles, the to-par colouring, the card rows, the nines, the empty
 * middles and the fixed summary now live in ./scorecardParts, imported by this
 * sheet AND by the neighbour preview drawn during a swipe. The derivations and
 * the values are the ones that were here; nothing about them moved.
 */
import {
  CAPTION, EVEN_GRAY, LABEL, LABEL_READ, RAIL_FIG,
  NohbhMiddle, Nine, NotPlayedLine, RoundSummaryHead, ScorecardSection,
  SkeletonMiddle, SyncingMiddle, UnavailableMiddle,
  fmtRel, nineSummary, toParColor,
} from './scorecardParts';


export interface CardScorecardHole {
  holeNo: number;
  par: number | null;
  strokes: number | null;
  /** Optional field average retained for course-context comparisons. */
  fieldAvg?: number | null;
}

export interface CardScorecardRounds {
  available: number[];
  active: number;
  onSelect: (r: number) => void;
}

/** Member-only enrichment from `get_round_course_context`. Defaults off. */
export interface CardScorecardCourseContext {
  /** Inclusive of this round — the hero cell figure. */
  yourAvgToPar?: number | null;
  /**
   * Average of the member's OTHER rounds here, NULL when this is the only one.
   * The caption compares against this, never the self-inclusive average.
   */
  avgToParOthers?: number | null;
  roundsHere?: number | null;
  rankHere?: number | null;
  /**
   * §C — THE INDEX THE ROUND WAS PLAYED OFF (`whs_scores.handicap_index_at_time`).
   * OPTIONAL AND DEFAULTING ABSENT: the tour caller never passes it and its
   * output is unchanged. NULL means the provider recorded none for that score —
   * nothing renders, and today's index is NOT substituted.
   */
  indexAtTime?: number | null;
}

export interface CardScorecardSheetProps {
  open: boolean;
  onClose: () => void;
  // HEADER (course-first)
  eyebrowText: string;
  courseName: string;
  courseLocation?: string | null;
  coursePar?: number | null;
  courseSlope?: number | null;
  // MIDDLE
  holes: CardScorecardHole[];
  nineHole?: boolean;
  rounds?: CardScorecardRounds;
  heroMuted?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  emptyVariant?: 'syncing' | 'nohbh' | 'unavailable';
  emptyGross?: number | null;
  emptyToPar?: number | null;

  /** Dedicated /round host. Every other caller uses the floating glass card. */
  presentation?: 'overlay' | 'page';

  /** 'member' (default) or 'tour'. Changes copy and stat labels only. */
  surface?: 'member' | 'tour';
  /** Member enrichment — omitted for a pro, who has no history at the venue. */
  courseContext?: CardScorecardCourseContext | null;
  /**
   * §E2/E3 — HOW MANY OTHER GOLFERS THE FIELD IS MADE OF, from
   * get_course_hole_field's `course_players` (the round's owner already
   * excluded). OPTIONAL AND DEFAULTING ABSENT: the tour caller never passes it.
   *
   * The per-hole FIELD row and its pool-basis / gate-fail copy were removed by
   * decision. This count remains for the independent beat-the-field summary.
   */
  fieldPlayers?: number | null;

  // IDENTITY BLOCK (below scorecard)
  playerName: string;
  playerAvatarUrl?: string | null;
  playerHcp?: number | null;
  playerHcpDelta?: number | null;
  playerUserId?: string | null;
  /** Member sheet subject. Resolved by the wrapper from viewer and round owner. */
  subjectIsViewer?: boolean;
  /**
   * S3 — TOUR ONLY. sr_players.photo_url is populated for 2 of 2,879 players, so
   * reading it alone showed initials for nearly every tour player. With these two
   * the tour branch goes through resolvePlayerAvatarCandidates — the canonical
   * resolver the player profile page uses — which builds the ordered storage-path
   * chain from the player's name. The MEMBER branch is untouched: a member avatar
   * is user_profiles.profile_photo_url and is unrelated.
   */
  playerTourSlug?: string | null;
  playerHeadshotOverride?: string | null;
  /** Tour: shows a position ("T4") in place of the handicap index. */
  identityStat?: { label: string; value: string } | null;
  // FOOTER
  onViewProfile?: () => void;
  onViewCourse?: () => void;
  /** C3 — shown only for the viewer's own round; opens the composer pre-filled. */
  onShareRound?: () => void;
  /**
   * ENGAGEMENT (BRIEF_ROUND_COMMENTS_EVERYWHERE §S2.2). The sheet is where a
   * member lands from a round notification, so it carries BOTH a like and a
   * comment control. The host resolves both (content_reactions on the score id,
   * comments_v2 on the resolved post) — this component only draws them, and
   * draws nothing when the prop is absent, so the tour surface is untouched.
   */
  engagement?: CardScorecardEngagement | null;
  /**
   * THE HONOURS TREATMENT (BRIEF_DISCOVER_FILTER_LED_BOARD S5.6/S8.3). The
   * honours board rail is deleted; its metal survives HERE, on the one surface
   * that shows a single feat round. Null for an ordinary round, which is nearly
   * all of them, and then nothing renders.
   */
  feat?: HonoursFeat | null;
  onHorizontalDrag?: {
    onStart: () => void;
    onMove: (dx: number) => void;
    onEnd: (dx: number, velocity: number) => void;
  } | null;
  /** §3 — fires once the "at this course" section is half visible. */
  onStatsSeen?: () => void;
  /**
   * BRIEF_ROUND_SHEET §2.2 — THE PAGE THE HOST IS DRAWING.
   * Explore owns the sequence, the thresholds and the spring; this component
   * only offsets its own content so the card follows the finger and slides out.
   * Absent for every other consumer, and then nothing about the layout changes.
   * `opacity` carries the reduced-motion crossfade, which replaces the slide.
   */
  pageShift?: { dx: number; opacity?: number; animating: boolean } | null;
  /**
   * §2.5 — the one-off "swipe for the next round" line. A string or nothing;
   * the host decides whether it has been earned and when it retires.
   */
  hint?: string | null;
  /**
   * BRIEF_ROUND_SHEET_PEEK §1 — THE NEIGHBOUR, DRAWN BESIDE THIS PAGE.
   * `side` says which edge it sits on: 'next' to the right (a leftward drag
   * brings it in), 'prev' to the left. It moves with the same `pageShift.dx` as
   * the content, so the two travel together. Absent for every other consumer.
   */
  pagePreview?: { node: React.ReactNode; side: 'next' | 'prev' } | null;
  /**
   * BRIEF_ROUND_SHEET_CUES §3 — PAGING WITHOUT A FINGER.
   * Swiping was the only way to change rounds. This adds two visually hidden but
   * focusable controls, the arrow keys, and the polite announcement of whatever
   * round arrived. Absent for every other consumer, which draws nothing extra.
   */
  paging?: {
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
    prevLabel: string;
    nextLabel: string;
    /** "{player}, {course}, {gross}" — read after a page settles. */
    announce: string;
  } | null;
}


export interface CardScorecardEngagement {
  likeHidden?: boolean;
  likeCount: number;
  likeMine: boolean;
  onToggleLike: () => void;
  likeLabel: string;
  /** Absent when the round has no post — no comment affordance at all (§1.6). */
  comment?: { count: number; label: string; onOpen: () => void } | null;
}

/* `ScorecardSection`, `fmtRel` and `toParColor` moved to scorecardParts. */

/* --------------------------------------------------------------- the card */

/*
 * THE ROW LABEL COLUMN IS GONE (Ben's ruling, superseding §D1 and everything
 * about widening it or measuring SCORE). A scorecard does not need to be told
 * that a row of 1..9 is the holes, that the row under it is par, or that the
 * marked row is the score — the marks are what distinguish the score row from
 * the par row above it. Removing the column removes the collision at source
 * instead of making room for a word nobody reads, and the freed 28px goes to
 * the nine hole columns, which is where a 390pt card is tightest.
 *
 * THE RIGHT-HAND 32px COLUMN STAYS. OUT / IN is a heading for a figure, not a
 * row label, and it is the one string on the card that is not inferable.
 *
 * BOTH SURFACES, ONE GRAMMAR: the member card was signed off WITH the labels
 * and loses them here too, because a tour card without them beside a member card
 * with them would be two grammars for the same object.
 */
/* The nine-column grid, the quiet par tone and `CardRow` live in
   scorecardParts now — see the note above, which still governs them. */

/**
 * ONE SOURCE FOR THE NINE FIGURES. The totals row now SHOWS its working
 * (OUT 36 / IN 39 / 75), so the gross beside the two nines must be the sum of
 * exactly the figures rendered above it. Both <Nine> and the totals row read
 * their par/strokes through this helper so the two can never be derived from
 * different filters and disagree on screen.
 */
/**
 * BRIEF_TOUR_SCORECARD_SHEET_FOUR_FAULTS S1 — A PARTIAL NINE IS NOT A NINE.
 *
 * `strokes` and `par` keep their old meaning (the full nine's arithmetic, which
 * the gross invariant at the totals block depends on). Two fields are ADDED:
 *
 *  - playedCount: how many holes on this nine carry a real score. Zero means
 *    the nine has not started, and a nine that has not started shows NOTHING —
 *    a 0 there is a claim, and it is false.
 *  - parPlayed: par for exactly the holes played, so a partial nine's strokes
 *    are compared against a par that covers the same holes (30 against 31 at
 *    eight holes, never 30 against 35).
 */
/* `nineSummary` moved to scorecardParts, unchanged. */


/* `Nine` and `CardRow` moved to scorecardParts: the swipe preview draws the
   same nines, so there is exactly one implementation of the card. */





/**
 * BRIEF_ROUND_SHEET follow-up B — THE SCORING KEY AND ITS COMPONENT ARE GONE.
 * `Legend` was dead-listed when §1.4 removed the key from the card, and nothing
 * mounted it afterwards, so it is deleted here along with its KEY_MARK sizes.
 * ONE line survives it: the unplayed-hole mark still needs explaining, and that
 * explanation now sits under the card itself (`courses:scorecard.legendNotPlayed`,
 * the only legend key still in the six locale files).
 */



/* ---------------------------------------------- round breakdown: DELETED

   `RoundSplit` and its `split` derivation went with the breakdown section in
   §1.4 and were dead-listed then. Nothing has mounted them since, so they are
   deleted (follow-up B). The distribution ramp itself is untouched: How It
   Plays, All Holes, Your Holes and the round shape all still read RAMP_TOPAR
   from the shared tokens. */


/* -------------------------------------------- loading and empty middles */

/* HandicapChip moved to scorecardParts with the summary that draws it. */

/* The loading, syncing, unavailable and gross-only middles are the shared ones
   (scorecardParts) — the preview shows the same syncing/unavailable middle when
   a neighbour has no hole data, so they cannot be two implementations. */


/* ------------------------------------------------------------- the sheet */

export const CardScorecardSheet: React.FC<CardScorecardSheetProps> = ({
  open, onClose, eyebrowText,
  courseName, courseLocation, coursePar, courseSlope,
  holes, nineHole, rounds, heroMuted, emptyMessage, loading,
  emptyVariant, emptyGross, emptyToPar,
  surface = 'member', courseContext, fieldPlayers = null,
  playerName, playerAvatarUrl, playerHcp, playerHcpDelta, playerUserId, subjectIsViewer, identityStat,
  playerTourSlug, playerHeadshotOverride,
  onViewProfile, onViewCourse, onShareRound, engagement = null,
  feat = null,
  presentation = 'overlay',
  onHorizontalDrag = null,
  onStatsSeen,
  pageShift = null,
  hint = null,
  pagePreview = null,
  paging = null,


}) => {
  const { t } = useTranslation(['courses']);
  /* §3 — THE ARROW KEYS PAGE. Bound at the document while the card is open and
     pageable, so the keys work wherever focus sits inside the sheet, and never
     when there is no sequence. Escape stays the presentation host's. */
  const pagingRef = useRef(paging);
  pagingRef.current = paging;
  useEffect(() => {
    if (!open || !paging) return;
    const onKey = (e: KeyboardEvent) => {
      const p = pagingRef.current;
      if (!p) return;
      if (e.key === 'ArrowRight' && p.hasNext) { e.preventDefault(); p.onNext(); }
      if (e.key === 'ArrowLeft' && p.hasPrev) { e.preventDefault(); p.onPrev(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, !!paging]);
  void emptyMessage;
  void coursePar;
  void courseSlope;

  /**
   * §B — THE KICKER. `nineHole` is no longer voided: a nine-hole round says so
   * on the one line that describes the round's format, and an eighteen-hole
   * round is unchanged (no suffix, no separator, no empty space).
   */
  const kickerText = nineHole
    ? (eyebrowText
        ? `${eyebrowText} \u00B7 ${t('courses:scorecard.nineHoleTag')}`
        : t('courses:scorecard.nineHoleTag'))
    : eyebrowText;


  const isTour = surface === 'tour';
  /**
   * S3 — the tour avatar's ordered candidate chain, from the ONE canonical
   * resolver (consumed, never re-implemented). photo_url still wins when it is
   * there; otherwise SquircleAvatar walks the name-derived storage paths and
   * falls back to initials only when every candidate misses.
   */
  const tourAvatarCandidates = React.useMemo(
    () => (isTour
      ? resolvePlayerAvatarCandidates({
          name: playerName,
          photoUrl: playerAvatarUrl ?? null,
          tourSlug: playerTourSlug ?? null,
          headshotOverride: playerHeadshotOverride ?? null,
        })
      : []),
    [isTour, playerName, playerAvatarUrl, playerTourSlug, playerHeadshotOverride],
  );
  const { user } = useSupabaseSession();
  /**
   * OWNERSHIP is still derived, never passed — it drives the amber own-member
   * rule on the member row and the card's score-column stub. The VOICE
   * machinery (possessives, impersonal fallbacks, subject slots) is gone with
   * the sentences: a figure rail has no subject to name, so an empty
   * playerName can no longer produce a bare apostrophe anywhere.
   */
  const isOwner = !isTour && (subjectIsViewer ?? (!!playerUserId && !!user?.id && playerUserId === user.id));


  const played = useMemo(
    () => holes.filter((h) => h.strokes != null && h.strokes > 0 && h.par != null),
    [holes],
  );

  const totals = useMemo(() => {
    let gross = 0;
    let toPar = 0;
    for (const h of played) {
      gross += h.strokes as number;
      toPar += (h.strokes as number) - (h.par as number);
    }
    return { gross, toPar, played: played.length > 0 };
  }, [played]);

  const fieldHoles = useMemo(() => played.filter((h) => h.fieldAvg != null), [played]);
  const withField = fieldHoles.length >= 2;

  /**
   * §E2 — "BEAT" IS STRICTLY BETTER. This counted `<=`, so a hole MATCHED
   * against the field average was reported as a hole beaten. Level is level.
   */
  const beatFieldOn = withField
    ? fieldHoles.filter((h) => (h.strokes as number) < (h.fieldAvg as number)).length
    : null;

  /**
   * §E2 — THE TRAJECTORY COMPARISON'S FIELD GATE.
   *
   * A field of one or two other golfers is not a field: measured 10 Sep 2026,
   * only about 15 of 198 mapped courses carry five or more players, so this gate
   * closes almost everywhere. THAT IS THE CORRECTION, NOT A REGRESSION — before
   * it, the comparison on every other course was a member measured largely
   * against themselves. Do not soften it.
   *
   * The per-hole FIELD row no longer exists. The threshold survives solely for
   * the independent beat-the-field comparison under the trajectory. Tour is
   * unaffected: it never calls the member field function.
   */
  const fieldGateOpen = isTour || (fieldPlayers != null && fieldPlayers >= FIELD_MIN_PLAYERS);

  /**
   * §G — WHY THERE IS NO CARD, AS A MEASURED FACT.
   *
   * 568 of 3,554 rounds (16%) cannot draw a card, and they fail for THREE
   * different reasons that the sheet previously collapsed into one: 148 have no
   * hole rows at all, 420 have rows with every gross null, and 195 have some
   * holes scored and some not. `holes.length > 0` was true for the middle group,
   * so those rounds drew an eighteen-column grid of empty cells.
   *
   * The cause is derived once, here, and used both by the render gate and by the
   * event, so what a member saw and what we recorded cannot disagree.
   */
  const cardCause: 'ok' | 'partial' | 'unscored' | 'norows' = useMemo(() => {
    if (holes.length === 0) return 'norows';
    if (played.length === 0) return 'unscored';
    return played.length === holes.length ? 'ok' : 'partial';
  }, [holes.length, played.length]);

  // scorecard_opened — has_field_data is the evidence for whether the
  // enrichment is reaching members at all; card_cause is the evidence for how
  // often the sheet opens on a round it cannot draw, split by reason.
  useEffect(() => {
    if (!open) return;
    analyticsEvents.track('scorecard_opened', {
      surface,
      holes: played.length,
      has_field_data: withField,
      card_cause: cardCause,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /**
   * BRIEF_ROUND_SHEET_SPLIT §2 — THE RAIL.
   *
   * Three facts, three figure-over-label pairs, in this order: rank here,
   * this round against the member's OTHER rounds here, holes matched or beaten
   * against the field. ANY FIGURE WHOSE SOURCE IS NULL PUSHES NOTHING — no
   * cell, no dash — and the rail closes up because it is a flex row.
   *
   * THE DERIVATIONS ARE THE ONES THAT WERE BEHIND THE SENTENCES, unchanged:
   *
   *  - vs-avg is gated on avgToParOthers being non-null, NOT on roundsHere > 1.
   *    The null is the honest signal: a member's only round at a course cannot
   *    be compared with their others, and the RPC returns null for exactly that
   *    case. othersCount stays Math.max(roundsHere - 1, 1) and is retained as
   *    the sample size behind the comparison even though the rail no longer
   *    prints it.
   *  - the field figure counts strokes < fieldAvg. A matched hole does not count.
   *    The denominator is fieldHoles.length (holes with both a score and a
   *    field average), never 18 and never played.length.
   *  - rank 1 does not take an ordinal (formatOrdinal(1) -> "1st", which read
   *    as "1st of 19"). It prints BEST instead, the same correction the
   *    neutral-best sentence carried.
   */
  /**
   * §C — ONE POOL PER PANEL. The member's rank here, this round against their
   * other rounds here, and the index they carried INTO the round are all one
   * pool: THE MEMBER'S OWN HISTORY AT THIS COURSE. They leave the header rail
   * and become a titled section that states its own sample ("Your 7 rounds
   * here"), so no figure sits beside a figure drawn from a different pool
   * without a basis.
   *
   * The derivations are byte-for-byte the ones that were in the rail:
   *  - rank 1 prints BEST, never "1st of 1".
   *  - vs-avg is gated on avgToParOthers being non-null (the RPC returns null
   *    when this is the member's only round here) — never on roundsHere > 1.
   *  - INDEX THEN is `handicap_index_at_time`, the index the round was played
   *    off. It is NOT the member's current index: the current index is a fact
   *    about today, and putting it on a round from March claimed something
   *    false. When the provider gave no index at the time, NOTHING renders —
   *    there is no fallback to today's figure.
   */
  const courseSection = useMemo(() => {
    const items: { key: string; value: string; label: string; tone?: string }[] = [];
    if (isTour || !courseContext) return items;
    const roundsHere = courseContext.roundsHere ?? 0;
    if (courseContext.rankHere != null && roundsHere > 0) {
      items.push({
        key: 'rank',
        value: courseContext.rankHere === 1
          ? t('courses:scorecard.figBest')
          : formatOrdinal(courseContext.rankHere),
        label: t('courses:scorecard.figOfRounds', { count: roundsHere }),
      });
    }
    const avgOthers = courseContext.avgToParOthers;
    if (avgOthers != null && totals.played) {
      const diff = Math.round((totals.toPar - avgOthers) * 10) / 10;
      items.push({
        key: 'vsavg',
        value: Math.abs(diff) < 0.05
          ? 'E'
          : diff < 0
            ? `\u2212${Math.abs(diff).toFixed(1)}`
            : `+${diff.toFixed(1)}`,
        label: t(isOwner ? 'courses:scorecard.figVsYourAvg' : 'courses:scorecard.figVsTheirAvg'),
        tone: Math.abs(diff) < 0.05 ? EVEN_GRAY : toParColor(diff < 0 ? -1 : 1),
      });
    }
    if (courseContext.indexAtTime != null) {
      items.push({
        key: 'indexthen',
        value: formatHcp(courseContext.indexAtTime),
        label: t('courses:scorecard.figHcpAtTime'),
      });
    }
    return items;
  }, [isTour, courseContext, totals, isOwner, t]);

  const rail = useMemo(() => {
    const items: { key: string; value: string; label: string; tone?: string }[] = [];
    /**
     * §E2 — THE BEAT-FIELD FIGURE HAS LEFT THE RAIL. It is the one figure on
     * this sheet drawn from the FIELD pool rather than the member's own history,
     * so it cannot sit beside self-history figures with no basis stated. It is
     * now a sentence under the trajectory, gated by `fieldGateOpen`.
     * `figBeatField` is deleted 10 Sep 2026.
     */
    /**
     * The tour position keeps the rail — a pro has no history section to move
     * into. The member's CURRENT index no longer appears here at all when the
     * course section renders: that section carries INDEX THEN, and showing both
     * put two different indexes on one sheet.
     */
    if (identityStat) {
      items.push({ key: 'identity', value: identityStat.value, label: identityStat.label });
    } else if (playerHcp != null && courseSection.length === 0) {
      items.push({
        key: 'hcp',
        value: formatHcp(playerHcp),
        label: t('courses:scorecard.handicapIndex'),
      });
    }
    return items;
  }, [identityStat, playerHcp, courseSection.length, t]);




  /* follow-up B — the `split` derivation is deleted with RoundSplit. */

  /* §3 — reached_stats: the "at this course" section was 50% or more visible at
     any point. Reported once per mount; the host owns the event. */
  const statsRef = React.useRef<HTMLDivElement | null>(null);
  const statsSeen = React.useRef(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!open || !el || !onStatsSeen || statsSeen.current) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.intersectionRatio >= 0.5 && !statsSeen.current) {
          statsSeen.current = true;
          onStatsSeen();
        }
      }
    }, { threshold: [0.5] });
    io.observe(el);
    return () => io.disconnect();
  }, [open, onStatsSeen, courseSection.length]);

  const out = holes.filter((h) => h.holeNo <= 9);

  const back = holes.filter((h) => h.holeNo > 9);

  /**
   * TOTALS ARE DERIVED FROM THE NINES SHOWN ABOVE, NOT COMPUTED SEPARATELY.
   * The row displays OUT n / IN n either side of the gross, so a reader adds
   * them. cardGross and cardTotalPar therefore come from the same nineSummary
   * calls that produced those two figures. to-par is NOT recomputed here: it
   * stays totals.toPar, the single hole-by-hole derivation.
   */
  const outSummary = nineSummary(out);
  const backSummary = back.length > 0 ? nineSummary(back) : null;
  const cardGross = outSummary.strokes + (backSummary?.strokes ?? 0);
  const cardTotalPar = outSummary.par + (backSummary?.par ?? 0);
  const totalPar = played.reduce((s, h) => s + (h.par as number), 0);
  /**
   * S1.3 — WHICH PAR THE ROUND IS SHOWN AGAINST. A completed card (18 or a
   * genuine nine) reads against the card's own par, exactly as before. A round
   * still in progress reads against the par of the holes played — the same par
   * totals.toPar is measured against — so the figures agree with each other.
   * cardGross and cardTotalPar are untouched: the invariant and the DEV warning
   * above keep their original inputs.
   */
  const allHolesPlayed = holes.length > 0 && played.length === holes.length;
  const shownPar = allHolesPlayed ? cardTotalPar : totalPar;
  /* FOLLOW-UP A — the not-played line is drawn from the SAME hole rows the card
     draws, so the line and the marks on the grid can never disagree. */
  const hasUnplayedHole = holes.length > 0 && !allHolesPlayed;
  /* §B — these gated the OUT / IN segments of the removed grand-totals row. The
     derivations are kept and voided rather than deleted: they are the sole
     record of the "a nine that has not started contributes NO segment" rule, and
     the per-nine totals inside <Nine> may need it if that row ever returns. */
  const showOutSeg = outSummary.playedCount > 0;
  const showInSeg = (backSummary?.playedCount ?? 0) > 0;
  void showOutSeg;
  void showInSeg;
  if (import.meta.env.DEV) {
    // The visible sum must agree with the hero/stat gross. A mismatch means the
    // nines and the round totals were filtered differently - loud, not silent.
    if (totals.played && cardGross !== totals.gross) {
      console.warn('[CardScorecardSheet] gross mismatch', { cardGross, gross: totals.gross });
    }
    // Par can legitimately differ mid-round: cardTotalPar counts every hole on
    // the card, totalPar only the holes played (which is what to-par is measured
    // against). Flag it so a full-round disagreement is not mistaken for that.
    if (totals.played && cardTotalPar !== totalPar && played.length === holes.length) {
      console.warn('[CardScorecardSheet] par mismatch', { cardTotalPar, totalPar });
    }
  }


  // The card column header has no room for a name and the legend above already
  // names the player, so a third-person card leaves the score-column label blank.
  /*
   * §D2 — A THIRD-PERSON CARD NO LONGER HAS AN UNLABELLED SCORE ROW. YOU is
   * right for the viewer's own round and wrong for anyone else's, but the answer
   * was never an empty cell: on a pro's card the row beneath PAR had no name at
   * all. It falls back to SCORE, which is true of every card.
   */
  /* DEAD-LISTED, NOT DELETED: the score-row stub string (scorecard.you /
     scorecard.scoreRow) had exactly one reader, the removed label cell. Keys
     stay in all six locales. */


  const showChip = playerHcpDelta != null && Math.abs(playerHcpDelta) >= 0.05;
  const showIdentity = !!playerName;
  /*
   * §G — THE GATE READS SCORED HOLES, NOT HOLE ROWS. 420 rounds carry eighteen
   * rows with every gross null; `holes.length > 0` let those through and drew a
   * grid of empty cells with a scoring key beneath it. An unscored round now
   * takes the same explained state as a round with no rows at all.
   */
  const hasHoles = cardCause === 'ok' || cardCause === 'partial';
  return (
    <ScorecardGlassOverlay
      open={open}
      onClose={onClose}
      contentReady={!loading}
      onHorizontalDrag={presentation === 'overlay' ? onHorizontalDrag : null}
      presentation={presentation}
    >
      <div
        style={{
          display: 'flex', flexDirection: 'column', fontFamily: SANS, flex: 1, minHeight: 0, ...FIGS,
          ...(pageShift
            ? {
                transform: `translate3d(${pageShift.dx}px, 0, 0)`,
                opacity: pageShift.opacity ?? 1,
                transition: pageShift.animating
                  ? 'transform 180ms cubic-bezier(.2,.8,.2,1), opacity 180ms linear'
                  : 'none',
                willChange: 'transform',
              }
            : null),
        }}
      >

        {/*
          S1 — THE FIXED SUMMARY (BRIEF_ROUND_SHEET_SPLIT).

          The score used to appear only at the FOOT of the expanded grid, after a
          date, a course, a handicap index and two links. It is now the first
          thing on the sheet and it does not scroll: the card, the breakdown and
          the card scroll beneath this block.

          §2.2 — A HORIZONTAL drag is read anywhere on the glass card and pages
          between rounds; the axis locks after 8px and only goes horizontal when
          it is clearly horizontal, so neither the dismiss nor the body scroll
          loses a gesture to it. This block does NOT print the breakdown any
          more: the fixed summary is the gross, the to-par, the player and the
          date, and nothing else.
        */}
        {/* THE HONOURS BAND. Champagne for the albatross, bone for the ace —
            they separate by SATURATION, never by value. It sits above the
            summary because the feat is why this round is worth a look. */}
        {feat && (
          <div
            style={{
              flexShrink: 0,
              background: honoursGround(feat),
              borderTop: `1px solid ${METAL_TOP_EDGE}`,
              borderBottom: `1px solid ${METAL_HAIRLINE}`,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: METAL_GOLD,
              }}
            >
              {feat === 'ace' ? 'Hole in one' : 'Albatross'}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: METAL_INK, opacity: 0.62 }}>
              {feat === 'ace' ? 'Honours' : 'Honours · rarest of all'}
            </span>
          </div>
        )}
        {/*
          §3 — PAGING FOR A READER WHO IS NOT SWIPING. Two real buttons, hidden
          from sight and not from focus or a screen reader, disabled at the ends;
          plus the polite region that names the round that arrived. Nothing here
          is drawn, so the sheet's look is unchanged.
        */}
        {paging && (
          <div onClick={(event) => event.stopPropagation()} style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="sr-only focus:not-sr-only"
              disabled={!paging.hasPrev}
              onClick={paging.onPrev}
            >
              {paging.prevLabel}
            </button>
            <button
              type="button"
              className="sr-only focus:not-sr-only"
              disabled={!paging.hasNext}
              onClick={paging.onNext}
            >
              {paging.nextLabel}
            </button>
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {paging.announce}
            </div>
          </div>
        )}
        {/* S1 — THE FIXED SUMMARY, now the shared RoundSummaryHead so the sheet
            and the swipe preview draw the identical block (BRIEF_ROUND_SHEET_PEEK). */}
        <RoundSummaryHead
          isTour={isTour}
          kickerText={kickerText}
          courseName={courseName}
          courseLocation={courseLocation}
          showScore={totals.played}
          gross={totals.gross}
          toPar={totals.toPar}
          shownPar={shownPar}
          coursePar={coursePar ?? null}
          heroMuted={heroMuted}
          playerName={playerName}
          playerAvatarUrl={playerAvatarUrl}
          playerUserId={playerUserId}
          tourAvatarCandidates={tourAvatarCandidates}
          isOwner={isOwner}
          playerHcpDelta={playerHcpDelta}
          rail={rail}
        />


        <div
          data-scorecard-scroll="true"
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            /* No fill — the sheet surface shows through
               (BRIEF_SHEET_BACKGROUND_CANON). */
            padding: '12px 14px calc(env(safe-area-inset-bottom, 0px) + 14px)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}
        >
          {/* ROUND SELECTOR */}
          {rounds && rounds.available.length > 1 && (
            <div
              onClick={(event) => event.stopPropagation()}
              style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}
            >
              {rounds.available.map((r) => {
                const active = r === rounds.active;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => rounds.onSelect(r)}
                    aria-pressed={active}
                    aria-label={t('courses:scorecard.roundN', { n: r })}
                    style={{
                      // S2 — flexShrink: 0. Inside an overflowX scroller the
                      // pills were shrinkable flex items and collapsed onto
                      // their padding box, painting as bare capsules. Every
                      // other pill row in the app pins this for the same reason.
                      flexShrink: 0,
                      minWidth: 44, textAlign: 'center',
                      padding: '6px 13px', borderRadius: 999,
                      background: active ? A.INK : A.PANEL,
                      color: active ? A.CANVAS : A.INK,
                      border: `1px solid ${active ? A.INK : A.BORDER}`,
                      fontFamily: SANS, fontSize: 11.5, fontWeight: 700, lineHeight: 1.2,
                      letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {t('courses:scorecard.roundShort', { n: r })}
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <div>
              <SkeletonMiddle />
            </div>
          ) : !hasHoles && emptyVariant === 'unavailable' ? (
            <div>
              <UnavailableMiddle />
            </div>
          ) : !hasHoles && emptyVariant === 'nohbh' ? (
            <div>
              <NohbhMiddle gross={emptyGross ?? null} toPar={emptyToPar ?? null} />
            </div>
          ) : !hasHoles ? (
            <div>
              <SyncingMiddle />
            </div>
          ) : (
            <>
              {/*
                S4.1 — THE CARD LEADS, because that is what the sheet is for. It
                is no longer behind a "Full scorecard" toggle: the grid was on
                the same screen as its own CTA. The scoring key stays with the
                card, directly beneath it (S4.2).
              */}
              <div>
              <ScorecardSection kicker={t('courses:scorecard.theCard')} flat={!isTour}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Nine rows={out} label={t('courses:scorecard.out')} />
                  {back.length > 0 && (
                    <Nine rows={back} label={t('courses:scorecard.in')} />
                  )}

                  {/*
                    BRIEF_ROUND_SCORECARD_REBUILD §B — THE GRAND TOTALS BLOCK IS
                    GONE. It printed the gross, the round par and the to-par a
                    second time, directly under a fixed header that shows all
                    three and never scrolls away. THE PER-NINE TOTALS SURVIVE:
                    each <Nine> still carries its own par and strokes total in
                    the right-hand column beside its OUT / IN label, which is the
                    figure a reader actually adds. Nothing else moved.
                  */}


                  {/* §1.4 — THE SCORING KEY IS GONE. Circles and boxes are
                      standard golf notation; a card does not carry its own
                      glossary. `Legend` is now DELETED (follow-up B).

                      FOLLOW-UP A — THE ONE MARK THAT IS NOT NOTATION. The faint
                      mid-dot for a hole the member never played was only ever
                      explained inside the key, so it left with it. It is named
                      here instead, in the key's own quiet style, and ONLY while
                      the round has an unplayed hole: a complete card says
                      nothing. Every consumer of this sheet gets the line. */}
                  {hasUnplayedHole && <NotPlayedLine />}
                  {/* §2.5 — ONE SENTENCE, ONCE. The host retires it after the
                      first page or the third open; there are no pager dots. */}
                  {hint && (
                    <div style={{ ...LABEL_READ, textAlign: 'center' }}>{hint}</div>
                  )}
                </div>
              </ScorecardSection>
              </div>

              {/*
                §C — AT THIS COURSE. ONE POOL: the member's own rounds at this
                venue. The kicker names the sample, so "BEST OF 1" — the most
                common case, since 274 member-course pairs hold exactly one
                round — reads as a fact about one round rather than a ranking
                against an invisible field. Renders only when a figure resolves,
                and never on the tour surface.
              */}
              {/* The kicker states the sample when we know it. With no round
                  count (INDEX THEN can resolve on its own) it falls back to the
                  bare title rather than claiming "your 0 rounds here". */}
              {courseSection.length > 0 && (
                <div ref={statsRef}>
                <ScorecardSection
                  kicker={t(isOwner ? 'courses:scorecard.atThisCourseSelf' : 'courses:scorecard.atThisCourseOther', {
                    name: playerName,
                  })}
                  flat={!isTour}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${courseSection.length}, minmax(0, 1fr))`, alignItems: 'start' }}>
                    {courseSection.map((it) => (
                      <div key={it.key} style={{ minWidth: 0, textAlign: 'center', padding: '0 4px' }}>
                        <div style={{ ...RAIL_FIG, color: it.tone ?? A.INK }}>{it.value}</div>
                        <div style={{ ...LABEL, fontSize: 9.5, marginTop: 5, lineHeight: 1.25 }}>{it.label}</div>
                      </div>
                    ))}
                  </div>
                  {!isTour && fieldGateOpen && withField && beatFieldOn != null && (
                    <p style={{ ...CAPTION, textAlign: 'center', marginTop: 16 }}>
                      {t(isOwner ? 'courses:scorecard.beatFieldSelf' : 'courses:scorecard.beatFieldOther', {
                        name: playerName,
                        n: beatFieldOn,
                        m: fieldHoles.length,
                      })}
                    </p>
                  )}
                </ScorecardSection>
                </div>
              )}

              {/* §1.4 — THE ROUND BREAKDOWN IS GONE. It recounted, as four
                  figures and a bar, the card that sits directly above it.
                  `RoundSplit` and the `split` derivation are DEAD-LISTED, not
                  deleted, and `courses:scorecard.split*` keys stay in all six
                  locale files. */}

            </>
          )}

          {/* S3.3 — EXITS BELONG AT THE END. */}
          {(engagement || onViewProfile || onViewCourse || onShareRound) && (
            <div
              data-scorecard-interactive="true"
              onClick={(event) => event.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', columnGap: 18, rowGap: 4, flexWrap: 'wrap', paddingTop: 2 }}
            >
              {engagement && (
                <span style={{ flex: 'none' }}>
                  <RoundEngagementActions
                    comment={engagement.comment ?? null}
                    like={{
                      hidden: engagement.likeHidden,
                      count: engagement.likeCount,
                      reacted: engagement.likeMine,
                      onToggle: engagement.onToggleLike,
                      label: engagement.likeLabel,
                    }}
                  />
                </span>
              )}
              <div
                data-scorecard-exit-links="true"
                style={{
                  flex: '1 0 200px', minWidth: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-evenly', whiteSpace: 'nowrap',
                }}
              >
                {onViewProfile && <Action label={t('courses:scorecard.viewProfile')} onClick={onViewProfile} />}
                {onViewCourse && <Action label={t('courses:scorecard.viewCourse')} onClick={onViewCourse} />}
                {onShareRound && <Action label={t('courses:scorecard.shareRound')} onClick={onShareRound} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/*
        BRIEF_ROUND_SHEET_PEEK §1 — THE NEIGHBOUR PEEK.

        One extra element, mounted only while a horizontal drag or its commit is
        in flight, and only for the neighbour in the drag's direction. It is
        absolutely positioned against the card and offset a full card width to
        the side, then translated by the SAME dx as
        the content, so finger, page and neighbour move as one.

        The preview starts where the current page's summary starts, so the two align
        exactly and the commit swap shows no jump.
      */}
      {pagePreview && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'hidden', pointerEvents: 'none',
            transform: `translate3d(calc(${pageShift?.dx ?? 0}px ${pagePreview.side === 'next' ? '+' : '-'} 100%), 0, 0)`,
            transition: pageShift?.animating
              ? 'transform 180ms cubic-bezier(.2,.8,.2,1)'
              : 'none',
            willChange: 'transform',
          }}
        >
          {pagePreview.node}
        </div>
      )}
    </ScorecardGlassOverlay>
  );
};

export default CardScorecardSheet;

