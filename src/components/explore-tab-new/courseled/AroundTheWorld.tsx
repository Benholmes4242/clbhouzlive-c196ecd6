import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { reviewLabelColor } from '@/components/shared/ReviewGhostScore';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useScorecardOpener } from '../useScorecardOpener';

import { ACTION_DEFAULTS, UNIT_DEFAULTS, type WireEvent } from '../hooks/useDiscoverWire';
import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { AroundTheWorldCard as AroundTheWorldCardShell } from './DiscoverCourseLedSkeleton';
import { useCourseLatestRatings } from './hooks/useCourseLatestRatings';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { ReactionAction, ReactionSlot } from './ReactionAction';

import { CourseNewsSheet, type CourseNewsEntry } from './CourseNewsSheet';
import { ShortlistGlassAction } from './ShortlistGlassAction';

import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import {
  createMasonryAssignment,
  placeStable,
  rememberColumns,
  type MasonryAssignment,
} from './stableMasonry';
import { CompactStandoutTile, estimateCompactHeight } from './CompactStandoutTile';
import { A, CARD_SHELL, Eyebrow, ImageChip, InkAction, LABEL, NEW_CARD_RING, NEW_ROW_BAR, NUMF, SANS, SCRIM_STRONG } from './tokens';
import { StandoutTile } from './StandoutTile';

/**
 * Section 2 — AROUND THE WORLD (BRIEF, section 2).
 *
 * The main feed and the only vertical one. Events are GROUPED BY COURSE: the
 * card is the course, the lines beneath are what happened there, newest first.
 * Five courses, then "Show N more courses" reveals the rest in place.
 *
 * NAMING: every actor is named — the "a member" anonymity rule is retired. The
 * viewing member's own name renders in amber; everyone else in ink. Rows carry
 * NO badges: the detail line carries the feat wording instead.
 */

/** Deep gold: 8px bright gold fails contrast on a light wash. */
const GOLD_TEXT = '#A87718';

/** Eight courses, one event each (BRIEF_SHEET_CAPS_ATW_AND_REVIEW §2). */
const PAGE = 8;

/**
 * A course may hold at most TWO tiles, and only via backfill when pass 1 left
 * the page short (BRIEF_ATW_BACKFILL). Never a third, even with slots to spare.
 */
const MAX_TILES_PER_COURSE = 2;

/**
 * ADJACENCY REPAIR. Two tiles for one course share a photograph, so they must
 * not sit consecutively in a column. Walk each column once; on a clash, swap
 * the offending tile with the next tile in the OTHER column when that resolves
 * it. Pure, single-pass, and a no-op when no clash exists — with six distinct
 * courses this never mutates anything.
 */
function deClashColumns<T extends { g: { courseId: string } }>(columns: T[][]): {
  columns: T[][];
  unresolved: number;
} {
  const cols = columns.map((c) => [...c]);
  let unresolved = 0;
  for (let ci = 0; ci < cols.length; ci += 1) {
    const other = cols[1 - ci];
    for (let i = 1; i < cols[ci].length; i += 1) {
      if (cols[ci][i].g.courseId !== cols[ci][i - 1].g.courseId) continue;
      // Candidate partner: the tile at the same depth in the other column.
      const j = i;
      const cand = other[j];
      const prevOther = other[j - 1];
      const nextOther = other[j + 1];
      const mine = cols[ci][i];
      const okThere =
        !!cand &&
        prevOther?.g.courseId !== mine.g.courseId &&
        nextOther?.g.courseId !== mine.g.courseId;
      const okHere =
        !!cand &&
        cand.g.courseId !== cols[ci][i - 1].g.courseId &&
        cand.g.courseId !== cols[ci][i + 1]?.g.courseId;
      if (okThere && okHere) {
        cols[ci][i] = cand;
        other[j] = mine;
      } else {
        unresolved += 1;
      }
    }
  }
  return { columns: cols, unresolved };
}


/**
 * PHOTO HEIGHT BY RANK POSITION, not by achievement (BRIEF_ATW_MASONRY §2).
 * Sized by type, a week of five aces would render five identical large tiles.
 * By position the silhouette is stable whatever happened and the largest tile
 * always means "the most notable thing in the last 90 days".
 *
 * BRIEF_STANDOUT_ROUNDS §4: every value reduced by 8, the taper preserved.
 */
export const ATW_PHOTO_HEIGHTS = [198, 160, 138, 122, 114, 108, 104, 101] as const;

/** A photo at or above this height gets the larger chip and name sizes. */
const TALL = 180;

const TILE_SCRIM =
  'linear-gradient(0deg, rgba(10,14,10,0.82) 0%, rgba(10,14,10,0) 32%)';

type ChipTier = 'gold' | 'green' | 'ink' | 'rating';

/**
 * DETERMINISTIC panel-height estimate for the masonry walk. Purely a function
 * of the strings and flags on the tile — no DOM measurement, no refs, no
 * reflow. Same input, same layout, every render.
 *
 * Recomputed for the BRIEF_STANDOUT_ROUNDS type (§4), then again for the
 * benchmark line (BRIEF_STANDOUT_TILE_MARGIN §4):
 *
 *   padding 11 + 12 = 23, WHO line 18 (13/700, one line)
 *   DETAIL 2 marginTop + 16 a line (12/600 at lineHeight 1.32), max two
 *   MARGIN 3 marginTop + 15 a line (11/600 at lineHeight 1.3 = 14.3, rounded
 *          up to 15), max two — it renders through StandoutTile's `subline`
 *          slot, so it is billed at THAT slot's real metrics, not at LABEL
 *          scale
 * BRIEF_STANDOUT_TILE_TAP_AND_MORE §3: the "+n more here" footer is gone from
 * this section, so the 15px MORE charge and its parameter came out with it. The
 * estimate is now exactly padding + WHO + DETAIL + MARGIN.
 *
 * A tile with NO detail line bills ZERO for it (§2) — the line is omitted, not
 * padded, so the estimate must not charge a minimum of one. THE SAME HOLDS FOR
 * THE MARGIN: aces and albatrosses carry no benchmark (a hole in one has no
 * previous best) and must not gain phantom height.
 *
 * The DETAIL line count comes from a character threshold at the ~151px inner
 * width (177px column less 13px side padding either side; 12px, ~6.4px/char
 * => ~24 chars a line), clamped at two. The MARGIN sets at 11px (~5.9px/char
 * => ~25 chars a line); the longest live string is "First clean card here" at
 * 21 characters, so every current benchmark is one line.
 */
function estimatePanelHeight(detail: string, margin: string): number {
  const lines = detail ? Math.min(2, Math.ceil(detail.length / 24)) : 0;
  const marginLines = margin ? Math.min(2, Math.ceil(margin.length / 25)) : 0;
  return (
    23 +
    18 +
    (lines > 0 ? 2 + lines * 16 : 0) +
    (marginLines > 0 ? 3 + marginLines * 15 : 0)
  );
}

/**
 * SHORTEST-COLUMN PLACEMENT. Walk the ranked list in order, put each tile in
 * whichever column is currently shorter by TOTAL rendered height (photo +
 * panel + the 8px gap), tie to the left. Pure and deterministic.
 *
 * KNOWN AND ACCEPTED: visual order is therefore not strictly rank order. That
 * is inherent to masonry. Alternating strictly left/right instead would leave
 * one column consistently longer on every render.
 */
export function splitMasonry<T>(items: T[], heightOf: (item: T, index: number) => number) {
  const cols: T[][] = [[], []];
  const totals = [0, 0];
  items.forEach((item, i) => {
    const c = totals[0] <= totals[1] ? 0 : 1;
    cols[c].push(item);
    totals[c] += heightOf(item, i) + (cols[c].length > 1 ? 8 : 0);
  });
  return { columns: cols, totals };
}

/**
 * PRECEDENCE, which is also the notability order that drives tile size
 * (BRIEF_ATW_MASONRY §5). Lower is more notable.
 *
 *   0 hole in one   1 albatross   2 new course record   3 bogey-free
 *   4 under par     5 birdie haul, 5+   6 anything else
 *
 * Bogey-free outranks under par: a bogey-free round is a strict subset of
 * under-or-level par, so it is the rarer, more specific claim.
 *
 * Eagles no longer reach this section, so they fall to the tail rather than
 * being given a rung of their own.
 */
 /**
 * THE THREE GROUPS (BRIEF_FEAT_SECTIONS_HIERARCHY §1.5), in the order the brief
 * fixes them. Anything not named falls to personal milestones, which is also
 * where a rating-only tile lands — it has no feat kind at all.
 *
 * THIS IS A RELATIVE ORDER, NOT AN ABSOLUTE ONE
 * (CORRECTION_HERO_INSIDE_ITS_GROUP §2.3): the hero now renders INSIDE its own
 * group, so the group holding it is PROMOTED TO FIRST and the rest keep this
 * relative order beneath it. That is what stops an ace — which is rarer than a
 * course record but sits in "Firsts here" — from being buried mid-section.
 */

const FEAT_GROUPS = [
  { id: 'records', kinds: ['crown'], key: 'discover.feat.group.records', label: 'Course records' },
  {
    id: 'firsts',
    kinds: ['ace', 'albatross', 'bogey_free'],
    key: 'discover.feat.group.firsts',
    label: 'Firsts here',
  },
  {
    id: 'milestones',
    kinds: ['under_par', 'birdie_haul'],
    key: 'discover.feat.group.milestones',
    label: 'Personal milestones',
  },
] as const;

function groupIdFor(kind: string | null): string {
  for (const g of FEAT_GROUPS) if (kind && (g.kinds as readonly string[]).includes(kind)) return g.id;
  return 'milestones';
}

/**
 * THE FEAT KIND, NAMED (§1.3). Used by the hero kicker only — the tiles carry
 * the wording in their detail line as before.
 */
const KIND_LABELS: Record<string, { key: string; label: string }> = {
  ace: { key: 'discover.feat.kind.ace', label: 'Hole in one' },
  albatross: { key: 'discover.feat.kind.albatross', label: 'Albatross' },
  crown: { key: 'discover.feat.kind.crown', label: 'Course record' },
  bogey_free: { key: 'discover.feat.kind.bogeyFree', label: 'Bogey-free round' },
  under_par: { key: 'discover.feat.kind.underPar', label: 'Round under par' },
  birdie_haul: { key: 'discover.feat.kind.birdieHaul', label: 'Birdie haul' },
};

/**
 * THE TWO LEAST-RARE KINDS RENDER COMPACT (§1.7) — a round under par and a
 * birdie haul are the floor of this section's scale, and a photograph on each is
 * what made eight tiles read as wallpaper. A rating-only tile has no feat at all
 * and follows the floor.
 */
const COMPACT_KINDS = new Set(['under_par', 'birdie_haul']);

/** HERO GEOMETRY (§1.1) and the second wide tile (§1.9). */
const HERO_PHOTO = 214;
const WIDE_PHOTO = 168;

function notability(e: WireEvent | undefined): number {
  switch (e?.kind) {
    case 'ace':
      return 0;
    case 'albatross':
      return 1;
    case 'crown':
      return 2;
    case 'bogey_free':
      return 3;
    case 'under_par':
      return 4;
    case 'birdie_haul':
      return 5;
    default:
      return 6;
  }
}

/** The one event a tile shows: most notable, newest as the tie-break. */
function headlineOf(events: WireEvent[]): WireEvent | undefined {
  return [...events].sort(
    (a, b) => notability(a) - notability(b) || (a.at < b.at ? 1 : -1),
  )[0];
}

/** Chip tier for the figure on the photograph. */
function chipTierFor(kind: WireEvent['kind'] | 'rating'): ChipTier {
  if (kind === 'ace' || kind === 'albatross') return 'gold';
  if (kind === 'rating') return 'rating';
  if (kind === 'crown' || kind === 'bogey_free' || kind === 'under_par') return 'green';
  return 'ink';
}

/**
 * THE CHIP CARRIES THE FIGURE; THE DETAIL LINE CARRIES WHAT THE FIGURE CANNOT
 * SAY (BRIEF_STANDOUT_ROUNDS §1). Where the two are one fact told twice the
 * line is dropped, not reworded:
 *
 *   birdie_haul  chip "6 BIRDIES"  line "Birdie haul - 6 in a round"  DROPPED
 *   bogey_free   chip "0 BOGEYS"   line "Bogey-free round"            DROPPED
 *   under_par    chip "-1 TO PAR"  line "Round under par"             DROPPED
 *
 *   crown        chip is the SCORE, the line is what the score MEANT (a new
 *                course record) — the figure cannot say that.            KEPT
 *   ace          chip "1 ACE", the line names the hole and its par.      KEPT
 *   albatross    as above.                                               KEPT
 *   eagle        as above (filtered out of this section, kept for the sheet's
 *                compact wording).                                       KEPT
 *   rating       chip is the value; the line says the member RATED the course,
 *                and it is the only wording an unnamed actor leaves.     KEPT
 *   anything else (actionKey wording) — unknown to the chip.             KEPT
 *
 * A drop only applies when the chip actually renders the figure. With no
 * figure the tile would otherwise say nothing at all.
 */
function detailAddsNothing(e: WireEvent, figure: string | null): boolean {
  if (!figure) return false;
  return e.kind === 'birdie_haul' || e.kind === 'bogey_free' || e.kind === 'under_par';
}

/** Legacy on-light figure tone — still used by the Course News sheet entries. */
function toneFor(kind: WireEvent['kind'] | 'rating'): string {
  const tier = chipTierFor(kind);
  if (tier === 'gold') return GOLD_TEXT;
  if (tier === 'green') return A.GREEN;
  return A.INK;
}


interface CourseGroup {
  courseId: string;
  courseName: string | null;
  courseImage: string | null;
  at: string;
  events: WireEvent[];
}

interface Props {
  events: WireEvent[];
  /**
   * TRUE while the wire read has NOT SETTLED (isPending, not isLoading — a
   * background refetch must never blank a populated section).
   */
  isPending: boolean;
  userId: string | undefined;
  scopeKey: string;
  pills: React.ReactNode;
  onCoursePress: (courseId: string) => void;
  /**
   * Opens the scorecard sheet on a specific round. Score-backed tiles use this;
   * anything without a round id falls back to onCoursePress.
   */
  onFeatPress?: (scoreId: string, ownerId: string | null) => void;
  onExpand?: (revealed: number) => void;
  /** Human lens label for the sheet caption ('For you', 'Worldwide'). */
  lensLabel?: string;
  /** Copy for the current lens when its set is empty. */
  emptyCopy?: string;
  /**
   * Relevance rank of a course for the active lens (0 = strongest signal).
   * When supplied it wins over recency for group order.
   */
  priorityFor?: (courseId: string) => number;
  /** Shortlist controls (BRIEF_DISCOVER_RELEVANCE part B). */
  canShortlist?: (courseId: string) => boolean;
  isShortlisted?: (courseId: string) => boolean;
  onToggleShortlist?: (courseId: string) => void;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
  /**
   * REPORTS THE MEMBERS THIS SECTION IS ACTUALLY RENDERING, once its tiles have
   * settled (BRIEF_PERSONAL_BESTS_SECTION §4.2b). Read-only instrumentation:
   * Personal Bests below needs the count per member to spend its shared budget,
   * and that fact only exists after the lens filter, the two slot passes and the
   * course-meta hold have all resolved. Nothing in this section's own logic
   * consults it.
   */
  onRenderedMembers?: (counts: Map<string, number>) => void;
}


/** Shared with Personal Bests, which must read the same ages. */
export function relativeWhen(
  iso: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (k: string, o?: any) => string,
): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return t('discover.when.today', 'Today');
  if (days === 1) return t('discover.when.yesterday', 'Yesterday');
  if (days < 7) return t('discover.when.daysAgo', { defaultValue: '{{count}} days ago', count: days });
  if (days < 14) return t('discover.when.lastWeek', 'Last week');
  if (days < 60)
    return t('discover.when.weeksAgo', { defaultValue: '{{count}}w ago', count: Math.floor(days / 7) });
  return t('discover.when.monthsAgo', {
    defaultValue: '{{count}}mo ago',
    count: Math.max(1, Math.round(days / 30)),
  });
}

export function AroundTheWorld({
  events,
  isPending,
  userId,
  scopeKey,
  pills,
  onCoursePress,
  onFeatPress,
  onExpand,
  lensLabel,
  emptyCopy,
  priorityFor,
  canShortlist,
  isShortlisted,
  onToggleShortlist,
  lastSeen = null,
  onRenderedMembers,
}: Props) {
  const { t } = useTranslation('courses');
  const [sheetOpen, setSheetOpen] = useState(false);
  const opener = useScorecardOpener();
  /**
   * Column memory for the life of this section (§4). A focus refetch may bring
   * new events; it must not move tiles the member has already seen.
   */
  const masonry = useRef(createMasonryAssignment());
  /**
   * ONE COLUMN MEMORY PER GROUP (§1.5 with §4 of the refresh policy). The
   * section is now several masonries, and `placeStable` rewrites its map from
   * what it was given — so a single shared assignment would have each group
   * erase the others' columns on every render.
   */
  const groupMasonry = useRef(new Map<string, MasonryAssignment>());
  const openReview = useReviewSheetStore((st) => st.open);

  const groups = useMemo<CourseGroup[]>(() => {
    const byCourse = new Map<string, CourseGroup>();
    for (const e of events) {
      if (!e.courseId) continue;
      // EAGLES have left THIS SECTION (BRIEF_ATW_MASONRY §5). The rail and the
      // tier are untouched — this is a display filter, nothing more.
      if (e.kind === 'eagle') continue;
      const g = byCourse.get(e.courseId);
      if (g) {
        // The FULL list is kept: the tile shows one headline and counts the
        // rest, and the Course News sheet reads from the same groups.
        g.events.push(e);
        if (e.at > g.at) g.at = e.at;
      } else {
        byCourse.set(e.courseId, {
          courseId: e.courseId,
          courseName: e.courseName,
          courseImage: e.courseImage,
          at: e.at,
          events: [e],
        });
      }
    }
    // Relevance first when the lens supplies a rank, recency as the tie-break.
    return [...byCourse.values()].sort((a, b) => {
      if (priorityFor) {
        const d = priorityFor(a.courseId) - priorityFor(b.courseId);
        if (d !== 0) return d;
      }
      return a.at < b.at ? 1 : -1;
    });
  }, [events, priorityFor]);


  // NEW SINCE: the event stamp the section already sorts by (play_date today;
  // an arrival stamp would be inherited automatically). A group is new when any
  // of its events is.
  const newGroupCount = countNewSince(groups, (g) => g.at, lastSeen);
  useReportNewCount('world', newGroupCount);

  /**
   * TILE RANK. Lens relevance still leads (the lenses are out of scope), then
   * NOTABILITY of the course's headline feat, then recency. Position 1 gets the
   * 206 photo, position 6 the 116.
   */
  const ranked = useMemo(() => {
    return [...groups]
      .map((g) => ({ g, top: headlineOf(g.events) }))
      .sort((a, b) => {
        if (priorityFor) {
          const d = priorityFor(a.g.courseId) - priorityFor(b.g.courseId);
          if (d !== 0) return d;
        }
        const n = notability(a.top) - notability(b.top);
        if (n !== 0) return n;
        return a.g.at < b.g.at ? 1 : -1;
      })
      .map(({ g }) => g);
  }, [groups, priorityFor]);

  /**
   * TILE SLOTS — THE KIND BUDGET (BRIEF_STANDOUT_KIND_BUDGET §1).
   *
   * The old two-pass walk ordered candidates by PRECEDENCE alone. With 208
   * course records in the GB&I cache and eight slots, records outranked
   * everything and took the whole section: the 49 bogey-free / under-par /
   * birdie-haul feats never appeared, and with one surviving group the headings
   * disappeared with them.
   *
   * The fix mirrors get_personal_bests' `kinded` CTE: rank each candidate AMONG
   * FEATS OF ITS OWN KIND (kn), then order on (kn, precedence, recency). Every
   * kind places its best tile before any kind places a second, so the mix
   * self-enforces AT MOST TWO PER KIND without a hard cap (eight slots, four or
   * more kinds with material) — and widens on its own when supply is thin:
   * 5 kinds -> 2,2,2,1,1 · 4 -> 2,2,2,2 · 3 -> 3,3,2 · 1 -> 8.
   * (BRIEF_FEAT_BALANCE_AND_LENS_ORDER §1.)
   *
   * THE HERO IS CHOSEN FIRST AND IS EXEMPT (§1.6): the rarest feat leads
   * regardless of kind and is removed from the pool the budget spends.
   *
   * PRECEDENCE IS UNCHANGED as the notability order that drives tile size
   * (§1.5) — only selection moved. MAX_TILES_PER_COURSE still caps a course at
   * two tiles, and the final order is still the display comparator.
   */
  const slots = useMemo(() => {
    type Slot = { g: CourseGroup; top: WireEvent | undefined; key: string };
    const perCourse = new Map<string, number>();
    const out: Slot[] = [];

    const candidates = ranked.flatMap((g) => g.events.map((e) => ({ g, e })));
    const byRarity = (a: { e: WireEvent }, b: { e: WireEvent }) =>
      notability(a.e) - notability(b.e) || (a.e.at < b.e.at ? 1 : -1);

    const heroCand = [...candidates].sort(byRarity)[0];

    const push = (c: { g: CourseGroup; e: WireEvent }) => {
      perCourse.set(c.g.courseId, (perCourse.get(c.g.courseId) ?? 0) + 1);
      out.push({ g: c.g, top: c.e, key: `${c.g.courseId}:${c.e.id}` });
    };

    if (heroCand) push(heroCand);

    // kn — rank within kind, in precedence-then-recency order.
    const perKind = new Map<string, number>();
    const kinded = [...candidates]
      .filter((c) => c.e.id !== heroCand?.e.id)
      .sort(byRarity)
      .map((c) => {
        const k = c.e.kind ?? 'other';
        const kn = perKind.get(k) ?? 0;
        perKind.set(k, kn + 1);
        return { ...c, kn };
      })
      .sort((a, b) => a.kn - b.kn || byRarity(a, b));

    for (const c of kinded) {
      if (out.length >= PAGE) break;
      if ((perCourse.get(c.g.courseId) ?? 0) >= MAX_TILES_PER_COURSE) continue;
      push(c);
    }

    // FINAL ORDER — the display comparator, so photo size still follows
    // relevance then precedence then recency.
    out.sort((a, b) => {
      if (priorityFor) {
        const d = priorityFor(a.g.courseId) - priorityFor(b.g.courseId);
        if (d !== 0) return d;
      }
      const n = notability(a.top) - notability(b.top);
      if (n !== 0) return n;
      const at = (a.top?.at ?? a.g.at) < (b.top?.at ?? b.g.at) ? 1 : -1;
      return at;
    });

    return { list: out, shownPerCourse: perCourse };
  }, [ranked, priorityFor]);



  /** Distinct courses on the page — meta, ratings and reactions read once each. */
  const shown = useMemo(() => {
    const seen = new Set<string>();
    const out: CourseGroup[] = [];
    for (const s of slots.list) {
      if (seen.has(s.g.courseId)) continue;
      seen.add(s.g.courseId);
      out.push(s.g);
    }
    return out;
  }, [slots]);
  const courseIds = useMemo(() => shown.map((g) => g.courseId), [shown]);
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;
  const { data: ratings } = useCourseLatestRatings(courseIds);

  // REACTIONS (BRIEF_DISCOVER_REACTIONS): ONE read for the visible tiles. The
  // headline feat reacts as 'round' on its score id; ANY rating with a reviewId
  // carries a control — a score with no prose is still likeable.
  const reactionTargets = useMemo<ReactionTarget[]>(() => {
    const out: ReactionTarget[] = [];
    for (const g of shown) {
      for (const e of g.events) if (e.scoreId) out.push({ type: 'round', id: e.scoreId });
      const rating = ratings?.get(g.courseId);
      if (rating?.reviewId) out.push({ type: 'review', id: rating.reviewId });
    }
    return out;
  }, [shown, ratings]);

  const reactions = useContentReactions(reactionTargets);

  /**
   * SETTLED means the same thing here as the whole-card hold below: the wire has
   * resolved AND course meta has landed, so the tiles on screen are final. Only
   * then is "who is rendered" a fact worth reporting downstream.
   */
  const tilesSettled = !isPending && !(courseIds.length > 0 && metaQuery.isPending);
  const renderedMemberKey = tilesSettled
    ? slots.list.map((s) => s.top?.userId ?? '-').join('|')
    : '';
  useEffect(() => {
    if (!tilesSettled || !onRenderedMembers) return;
    const counts = new Map<string, number>();
    for (const s of slots.list) {
      const uid = s.top?.userId;
      if (!uid) continue;
      counts.set(uid, (counts.get(uid) ?? 0) + 1);
    }
    onRenderedMembers(counts);
    // renderedMemberKey is the stable summary of what is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tilesSettled, renderedMemberKey]);





  /**
   * Actor name. NEVER falls back to "You" — a missing name returns '' and the
   * row renders the feat wording alone (see the row renderer). Attribution is
   * only ever "You" when the payload carries a user_id that strictly equals
   * the signed-in member's id.
   */
  const nameFor = (e: WireEvent): string => e.actorName?.trim() ?? '';

  /**
   * The detail line carries the feat wording — there are no badges here.
   * `compact` returns the shortened form the news sheet cards use (2-line
   * clamp). Ordinals arrive already formatted on the payload; nothing is
   * concatenated inside a locale string, and missing hole/par degrades to the
   * short form rather than printing an empty bracket.
   */
  const detailFor = (e: WireEvent, compact = false): string => {
    const hole = e.actionParams?.hole ? String(e.actionParams.hole) : '';
    const par = e.holePar;

    if (e.kind === 'ace' || e.kind === 'albatross') {
      const isAce = e.kind === 'ace';
      if (!hole)
        return isAce
          ? t('discover.row.aceNoHole', 'Hole in one')
          : t('discover.row.albatrossNoHole', 'Albatross');
      if (compact)
        return t(isAce ? 'discover.row.compactAce' : 'discover.row.compactAlbatross', {
          defaultValue: isAce ? 'Hole in one - {{hole}}' : 'Albatross - {{hole}}',
          hole,
        });
      if (par == null)
        return isAce
          ? t('discover.row.aceNoHole', 'Hole in one')
          : t('discover.row.albatrossNoHole', 'Albatross');
      return t(isAce ? 'discover.row.ace' : 'discover.row.albatross', {
        defaultValue: isAce
          ? 'Hole in one - the {{hole}}, par {{par}}'
          : 'Albatross - the {{hole}}, par {{par}}',
        hole,
        par,
      });
    }

    if (e.kind === 'eagle') {
      if (!hole) return t('discover.row.eagleNoHole', 'Eagle');
      if (compact)
        return t('discover.row.compactEagle', { defaultValue: 'Eagle - {{hole}}', hole });
      if (par == null) return t('discover.row.eagle', 'Eagle');
      return t('discover.row.eaglePar', {
        defaultValue: 'Eagle - {{hole}} hole, par {{par}}',
        hole,
        par,
      });
    }

    if (e.kind === 'birdie_haul') {
      const count = Number(e.actionParams?.count ?? 0);
      return compact
        ? t('discover.row.compactBirdieHaul', { defaultValue: 'Birdie haul - {{count}}', count })
        : t('discover.row.birdieHaul', {
            defaultValue: 'Birdie haul - {{count}} in a round',
            count,
          });
    }

    if (e.kind === 'under_par') return t('discover.row.underPar', 'Round under par');

    if (e.kind === 'bogey_free') return t('discover.row.bogeyFree', 'Bogey-free round');


    if (e.kind === 'crown') {
      const slug = String(e.actionParams?.categorySlug ?? '');
      if (!slug || slug === 'lowest_gross')
        return t('discover.row.crownCourseRecord', 'New course record');
      const category = String(e.actionParams?.category ?? slug.replace(/_/g, ' ')).toLowerCase();
      return t('discover.row.crown', {
        defaultValue: 'New {{category}} record',
        category,
      });
    }

    return t(e.actionKey, {
      defaultValue: ACTION_DEFAULTS[e.actionKey] ?? '',
      ...(e.actionParams ?? {}),
    });
  };


  const figLabelFor = (e: WireEvent): string => {
    if (e.figureSubKey)
      return t(e.figureSubKey, {
        defaultValue: UNIT_DEFAULTS[e.figureSubKey] ?? '',
        ...(e.figureSubParams ?? {}),
      }).toUpperCase();
    return t('discover.row.labelScore', 'SCORE');
  };

  /** Complete list for the sheet, notability first, newest as the tie-break. */
  const newsEntries = useMemo<CourseNewsEntry[]>(() => {
    return groups
      .map((g) => {
        const top = [...g.events].sort(
          (a, b) => notability(a) - notability(b) || (a.at < b.at ? 1 : -1),
        )[0];
        const actor =
          top && userId && top.userId && top.userId === userId
            ? t('discover.wire.you', 'You')
            : (top?.actorName?.trim() ?? '');
        const feat = top ? detailFor(top, true) : '';
        const rating = ratings?.get(g.courseId);
        const useRating = !top?.figure && !!rating;

        let figure: string | null = null;
        let figureUnit: string | null = null;
        let onPress: (() => void) | undefined;

        if (useRating && rating) {
          figure = rating.rating.toFixed(1);
          figureUnit = t('discover.row.labelRating', 'RATING');
          if (rating.reviewId) {
            onPress = () => {
              analyticsEvents.track('discover_world_row_tap', { kind: 'rating' });
              openReview({
                user: {
                  id: rating.userId ?? '',
                  name: rating.actorName?.trim() || '',
                  avatar: rating.actorAvatar ?? undefined,
                },
                courseId: g.courseId,
                courseName: g.courseName ?? '',
                rating: rating.rating,
                reviewId: rating.reviewId,
                reviewText: rating.reviewText,
              });
            };
          }
        } else if (top) {
          figure = top.figure ?? null;
          figureUnit = top.figure ? figLabelFor(top) : null;
          if (top.scoreId) {
            const scoreId = top.scoreId;
            const ownerId = top.userId;
            onPress = () => {
              analyticsEvents.track('discover_world_row_tap', { kind: 'feat' });
              opener.openByScore(scoreId, null, ownerId);
            };
          }
        }

        const ratingLine =
          useRating && rating
            ? `${
                userId && rating.userId && rating.userId === userId
                  ? t('discover.wire.you', 'You')
                  : (rating.actorName?.trim() ?? '')
              }`
            : '';

        const line = useRating
          ? ratingLine
            ? `${ratingLine} \u00B7 ${t('discover.row.rated', 'Rated this course')}`
            : t('discover.row.rated', 'Rated this course')
          : actor
            ? `${actor} \u00B7 ${feat}`
            : feat;

        return {
          courseId: g.courseId,
          courseName: g.courseName,
          courseImage: g.courseImage,
          at: g.at,
          topLine: line,
          figure,
          figureUnit,
          onPress,
          rank: top ? notability(top) : 5,
        };
      })
      .sort((a, b) => {
        if (priorityFor) {
          const d = priorityFor(a.courseId) - priorityFor(b.courseId);
          if (d !== 0) return d;
        }
        return a.rank - b.rank || (a.at < b.at ? 1 : -1);
      })
      .map(({ rank: _rank, ...rest }) => rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, ratings, userId, t, priorityFor]);



  // WHOLE-CARD HOLD (layer 2a): course meta feeds each card's NAME and IMAGE,
  // so a card cannot be drawn from the wire rows alone without rewriting itself
  // a moment later. The shared shell holds the slot; the pills stay live so the
  // lens row never disappears under the reader's thumb.
  if (isPending || (courseIds.length > 0 && metaQuery.isPending)) {
    return <AroundTheWorldCardShell pills={pills} />;
  }

  return (
    <>
    <section>
      <Eyebrow
        dot={newGroupCount > 0}
        aside={<span style={LABEL}>{t('discover.last90', 'Last 90 days')}</span>}
      >
        {t('discover.aroundTheWorld', 'Standout rounds')}
      </Eyebrow>

      {pills}

      {groups.length === 0 ? (
        <div style={{ ...CARD_SHELL, padding: '18px 16px' }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: A.MUTE }}>
            {emptyCopy ??
              t('discover.emptyPool', 'Nothing logged anywhere in the last 90 days.')}
          </p>

        </div>
      ) : (
        <>
        {(() => {
          /**
           * TILE MODELS, built in rank order so the photo height is a pure
           * function of position. Everything the masonry walk needs is decided
           * here — the placement step never touches the DOM.
           */
          const tiles = slots.list.map(({ g, top, key: slotKey }, i) => {
            const m = meta?.get(g.courseId);
            const rating = ratings?.get(g.courseId);

            const photo = ATW_PHOTO_HEIGHTS[Math.min(i, ATW_PHOTO_HEIGHTS.length - 1)];
            const tall = photo >= TALL;

            // ONE FIGURE PER TILE, on the photograph. A rating only steps in
            // when the headline feat has no figure of its own.
            let figure: string | null = null;
            let unit = '';
            let tier: ChipTier = 'ink';
            let who = '';
            let isOwn = false;
            let detail = '';
            let reactTo: { type: 'round' | 'review'; id: string } | undefined;
            let onPress: (() => void) | undefined;

            if (top) {
              who = nameFor(top);
              isOwn = !!userId && !!top.userId && top.userId === userId;
              detail = detailFor(top);
              tier = chipTierFor(top.kind);
              if (top.figure) {
                figure = top.figure;
                unit = figLabelFor(top);
              } else if (top.kind === 'ace' || top.kind === 'albatross') {
                figure = '1';
                unit = t(
                  top.kind === 'ace'
                    ? 'discover.wire.unit.ace'
                    : 'discover.wire.unit.albatross',
                  { defaultValue: top.kind === 'ace' ? 'ace' : 'albatross' },
                ).toUpperCase();
              }
              if (top.scoreId) {
                reactTo = { type: 'round', id: top.scoreId };
                const scoreId = top.scoreId;
                const ownerId = top.userId;
                onPress = () => {
                  analyticsEvents.track('discover_world_row_tap', { kind: 'feat' });
                  opener.openByScore(scoreId, null, ownerId);
                };
              }
            }

            if (!figure && rating) {
              figure = rating.rating.toFixed(1);
              unit = t('discover.row.labelRating', 'RATING');
              tier = 'rating';
              if (!top) {
                who = rating.actorName?.trim() ?? '';
                isOwn = !!userId && !!rating.userId && rating.userId === userId;
                detail = t('discover.row.rated', 'Rated this course');
                if (rating.reviewId) reactTo = { type: 'review', id: rating.reviewId };
                if (rating.reviewId && (rating.reviewText ?? '').trim()) {
                  onPress = () => {
                    analyticsEvents.track('discover_world_row_tap', { kind: 'rating' });
                    openReview({
                      user: {
                        id: rating.userId ?? '',
                        name: rating.actorName?.trim() || '',
                        avatar: rating.actorAvatar ?? undefined,
                      },
                      courseId: g.courseId,
                      courseName: m?.name ?? g.courseName ?? '',
                      rating: rating.rating,
                      reviewId: rating.reviewId,
                      reviewText: rating.reviewText,
                    });
                  };
                }
              }
            }

            // "+n more here" EXCLUDES every event promoted into its own tile,
            // otherwise a backfilled event would be advertised twice.
            const more = Math.max(
              0,
              g.events.length - (slots.shownPerCourse.get(g.courseId) ?? 1),
            );

            /**
             * ONE FACT, ONCE (BRIEF_STANDOUT_ROUNDS §1). Where the chip already
             * carries the whole fact, the detail line is OMITTED rather than
             * reworded — see `detailAddsNothing`. `detail` is still computed:
             * with no actor name the panel has nothing else to say and falls
             * back to the wording (the line below the WHO slot is the
             * duplicate, not the fallback).
             */
            const detailShown = !!detail && !(top && detailAddsNothing(top, figure));

            /**
             * THE BENCHMARK (BRIEF_STANDOUT_TILE_MARGIN §2). Server-supplied and
             * rendered VERBATIM — not reformatted, not appended to, not
             * translated here, and never rebuilt from the other fields. Null on
             * aces and albatrosses, which bill zero height for it.
             *
             * `detailAddsNothing`'s principle extends here: if the benchmark and
             * the detail are one fact told twice, the BENCHMARK is dropped.
             */
            const marginRaw = (top?.featMargin ?? '').trim();
            const detailText = who && detailShown ? detail : '';
            const margin =
              marginRaw && marginRaw.toLowerCase() === detailText.trim().toLowerCase()
                ? ''
                : marginRaw;

            return {
              g,
              m,
              slotKey,
              kind: top?.kind ?? null,
              at: top?.at ?? g.at,
              rarity: notability(top),
              photo,
              tall,
              figure,
              unit,
              tier,
              who,
              isOwn,
              detail,
              detailShown,
              margin,
              more,
              scoreId: top?.scoreId ?? null,
              ownerId: top?.userId ?? null,
              reactTo,
              onPress,
              height: photo + estimatePanelHeight(detailText, margin),
            };
          });

          type Tile = (typeof tiles)[number];

          const detailOf = (tt: Tile) =>
            /* ONE FACT, ONCE: where the chip carries the whole fact the line is
               omitted — unless there is no name, in which case the wording IS
               the title. */
            tt.detailShown ? tt.detail : tt.who ? '' : tt.detail;

          const pressOf = (tt: Tile) => () => {
            /* THE TAP OPENS THE ROUND (BRIEF_STANDOUT_TILE_TAP_AND_MORE §2). A
               feat without a score id — a rating-only tile — falls back to the
               course page rather than rendering a tile that does nothing. */
            if (onFeatPress && tt.scoreId) {
              analyticsEvents.track('discover_world_tile_tap', {
                source: 'around_the_world',
                /* BACKFILL MARKER (BRIEF_STANDOUT_ROUNDS_BACKFILL §4): priority
                   3 means the tile arrived from the worldwide pool. */
                backfilled: priorityFor ? priorityFor(tt.g.courseId) === 3 : false,
              });
              onFeatPress(tt.scoreId, tt.ownerId);
              return;
            }
            onCoursePress(tt.g.courseId);
          };

          /* FIXED-WIDTH TRAILING SLOT — rendered whether or not a control
             appears, so names never go ragged between a tile with a reaction and
             one without. */
          const trailingOf = (tt: Tile) => (
            <ReactionSlot>
              {tt.reactTo
                ? (() => {
                    const st = reactions.stateFor(tt.reactTo.type, tt.reactTo.id);
                    return (
                      <ReactionAction
                        hidden={!reactions.viewerId || reactions.unavailable}
                        readOnly={tt.isOwn}
                        count={st.count}
                        reacted={st.mine}
                        /* The count column is reserved so the heart itself lands
                           on the same x down a column, reacted or not (§5b). */
                        reserveCount
                        onToggle={() => reactions.toggle(tt.reactTo!.type, tt.reactTo!.id)}
                        label={
                          tt.reactTo.type === 'round'
                            ? t('discover.reactions.action', 'Like this round')
                            : t('discover.reactions.actionReview', 'Like this review')
                        }
                      />
                    );
                  })()
                : null}
            </ReactionSlot>
          );

          const nameOf = (tt: Tile) =>
            tt.m?.name ?? tt.g.courseName ?? t('discover.unknownCourse', 'Course');

          const photoTile = (
            tt: Tile,
            opts?: { photo?: number; hero?: boolean; showKicker?: boolean },
          ) => (
            <StandoutTile
              key={tt.slotKey}
              courseId={tt.g.courseId}
              courseName={nameOf(tt)}
              imageUrl={tt.m?.imageUrl ?? tt.g.courseImage}
              region={tt.m?.region ?? null}
              photo={opts?.photo ?? tt.photo}
              figure={tt.figure}
              unit={tt.unit}
              whenLabel={relativeWhen(tt.g.at, t)}
              who={tt.who}
              isOwn={tt.isOwn}
              detail={detailOf(tt)}
              onDetailPress={tt.onPress}
              /* THE BENCHMARK, through the same `subline` slot Personal Bests
                 uses for its reference_line. Verbatim; null renders nothing. */
              subline={tt.margin || null}
              isNew={isNewSince(tt.g.at, lastSeen)}
              /* HERO ONLY: the course name grows to 21px and the figure chip
                 takes its large size (§1.1). The kind kicker renders only when
                 no group heading sits above the hero
                 (CORRECTION_HERO_INSIDE_ITS_GROUP §3). */
              kicker={
                opts?.showKicker && tt.kind && KIND_LABELS[tt.kind]
                  ? t(KIND_LABELS[tt.kind].key, KIND_LABELS[tt.kind].label)
                  : null
              }
              nameSize={opts?.hero ? 21 : undefined}
              chipScale={opts?.hero ? 'lg' : 'md'}
              onPress={pressOf(tt)}
              trailing={trailingOf(tt)}
            />
          );

          const compactTile = (tt: Tile) => (
            <CompactStandoutTile
              key={tt.slotKey}
              courseName={nameOf(tt)}
              region={tt.m?.region ?? null}
              figure={tt.figure}
              unit={tt.unit}
              whenLabel={relativeWhen(tt.g.at, t)}
              who={tt.who}
              isOwn={tt.isOwn}
              detail={detailOf(tt)}
              subline={tt.margin || null}
              isNew={isNewSince(tt.g.at, lastSeen)}
              onPress={pressOf(tt)}
              trailing={trailingOf(tt)}
            />
          );

          /**
           * THE HERO (§1.1, §1.2): RARITY TIER FIRST, THEN MOST RECENT WITHIN
           * IT. Not "the first tile" — rank order also carries the friends-first
           * priority, so the top slot is frequently a birdie haul at a course
           * the member knows while an ace sits third.
           */
          const hero = [...tiles].sort(
            (a, b) => a.rarity - b.rarity || (a.at < b.at ? 1 : -1),
          )[0];
          const rest = tiles.filter((tt) => tt !== hero);

          /**
           * GROUPS (§1.5) in the brief's fixed order. MIN_GROUP IS ONE
           * (BRIEF_STANDOUT_KIND_BUDGET §2): a group with a single tile KEEPS
           * its heading, so the merge-down / merge-up fold that used to run here
           * was REMOVED DELIBERATELY rather than left as dead code. An empty
           * group renders nothing at all; the one-group rule below still drops
           * the heading when only one group survives.
           */
          const heroGroupId = groupIdFor(hero.kind);
          const buckets = FEAT_GROUPS.map((def) => ({
            id: def.id,
            label: t(def.key, def.label),
            items: rest.filter((tt) => groupIdFor(tt.kind) === def.id),
          }))
            /* The hero's group survives even when the hero is its only tile. */
            .filter((b) => b.items.length > 0 || b.id === heroGroupId)
            /* §2.3: THE GROUP HOLDING THE HERO IS PROMOTED TO FIRST; the others
               keep their relative order beneath it. */
            .sort((a, b) => (a.id === heroGroupId ? -1 : b.id === heroGroupId ? 1 : 0));


          /**
           * A REPEATED COURSE LOSES ITS PHOTO (§1.8), decided in RENDER order —
           * hero first, then group by group — so the tile the member sees first
           * is the one that keeps the photograph. §1.7 applies on top: the two
           * least-rare kinds are compact wherever they sit.
           */
          const seenCourses = new Set<string>([hero.g.courseId]);
          const compactKeys = new Set<string>();
          for (const b of buckets) {
            for (const tt of b.items) {
              const repeated = seenCourses.has(tt.g.courseId);
              seenCourses.add(tt.g.courseId);
              if (repeated || COMPACT_KINDS.has(tt.kind ?? '') || !tt.kind) {
                compactKeys.add(tt.slotKey);
              }
            }
          }

          /**
           * A SECOND WIDE TILE further down (§1.9): the first tile of the SECOND
           * surviving group runs full width — and only when that group still
           * holds MORE THAN TWO tiles after the pull, so a group is never left
           * as one wide tile and a single column.
           *
           * §4.2: the hero's group is always buckets[0] after promotion, so the
           * second wide tile can never land in the hero's group — no group ever
           * carries two full-width tiles.
           */
          const secondGroup = buckets[1];
          const wide =
            secondGroup && secondGroup.items.length - 1 > 2 ? secondGroup.items[0] : null;

          /* §3.3: the kicker only survives when NO heading sits above the hero,
             i.e. the one-group case where headings are dropped. */
          const heroKicker = buckets.length === 1;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>


              {buckets.map((b, bi) => {
                const isWide = (tt: Tile) => wide != null && tt.slotKey === wide.slotKey;
                const laid = b.items
                  .filter((tt) => !isWide(tt))
                  .map((tt) => {
                    const compact = compactKeys.has(tt.slotKey);
                    return {
                      ...tt,
                      compact,
                      /* EVERY SHAPE BRINGS ITS OWN ESTIMATE (§0.1). */
                      height: compact
                        ? estimateCompactHeight(detailOf(tt), tt.margin || '')
                        : tt.height,
                    };
                  });

                // Existing tiles hold the column they were given; only tiles new
                // to this session are placed greedily. The de-clash pass may
                // still swap a pair to keep two tiles of one course off
                // consecutive rows, and the result is remembered so the repair
                // itself never churns again.
                let asg = groupMasonry.current.get(b.id);
                if (!asg) {
                  asg = createMasonryAssignment();
                  groupMasonry.current.set(b.id, asg);
                }
                const placed = placeStable(laid, asg);
                const declashed = deClashColumns(placed.columns);
                rememberColumns(declashed.columns, asg);

                return (
                  <div key={b.id}>
                    {/* A single surviving group needs no heading — the section
                        eyebrow already says what it is. */}
                    {buckets.length > 1 ? (
                      <div
                        style={{
                          ...LABEL,
                          fontSize: 9,
                          color: A.MUTE,
                          padding: '0 2px',
                          marginBottom: 8,
                        }}
                      >
                        {b.label}
                      </div>
                    ) : null}

                    {/* THE HERO (§1.1) — first and largest tile of its OWN
                        group, above that group's masonry. */}
                    {b.id === heroGroupId ? (
                      <div style={{ marginBottom: 8 }}>
                        {photoTile(hero, {
                          photo: HERO_PHOTO,
                          hero: true,
                          showKicker: heroKicker,
                        })}
                      </div>
                    ) : null}


                    {wide && bi === 1 ? (
                      <div style={{ marginBottom: 8 }}>
                        {photoTile(wide, { photo: WIDE_PHOTO })}
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {declashed.columns.map((col, ci) => (
                        <div
                          key={ci}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          {col.map((tt) => (tt.compact ? compactTile(tt) : photoTile(tt)))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}


        {groups.length > PAGE && (
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <InkAction
              onClick={() => {
                analyticsEvents.track('discover_world_sheet_open', {
                  courses: groups.length,
                });
                setSheetOpen(true);
                onExpand?.(groups.length - PAGE);
              }}
            >
              {t('discover.seeAllCourses', {
                defaultValue: 'See all {{count}} courses',
                count: groups.length,
              })}
            </InkAction>
          </div>
        )}
        </>

      )}
    </section>

      <CourseNewsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        entries={newsEntries}
        lensLabel={lensLabel ?? t('discover.lens.worldwide', 'Worldwide')}
        whenLabel={(iso) => relativeWhen(iso, t)}
        onCoursePress={onCoursePress}
        canShortlist={canShortlist}
        isShortlisted={isShortlisted}
        onToggleShortlist={onToggleShortlist}

      />

      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </>
  );
}

export default AroundTheWorld;
