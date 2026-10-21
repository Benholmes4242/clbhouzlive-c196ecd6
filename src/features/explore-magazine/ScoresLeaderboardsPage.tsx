import { useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { StandoutRounds, type RoundPressTarget } from '@/components/explore-tab-new/courseled/StandoutRounds';
import { CompetitionBoards } from '@/components/explore-tab-new/courseled/CompetitionBoards';
import { JustPlayed } from '@/components/explore-tab-new/courseled/JustPlayed';
import { MemberAvatar } from '@/components/explore-tab-new/courseled/MemberAvatar';
import { SEASON_ROW_METRICS } from '@/components/explore-tab-new/courseled/rowMetrics';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { describeFilterParts } from '@/components/explore-tab-new/courseled/describeFilters';
import { type BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import {
  BOARD_LABELS,
  DEFAULT_FILTERS,
  BOARD_ROW_FLOOR,
  WINDOW_OPTIONS,
  type BoardFilters,
  type BoardKey,
  type WindowKey,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { entryFiltersFor, type AmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ScopeSegments } from './ScoresFilterHead';
import { handicapPairDisplay } from './circleHandicap';
import { fmtHcp } from '@/lib/whs/format';
import { playDateAtLocalNoon } from '@/components/explore-tab-new/courseled/discoverWhen';
import { SELF_ROW_TINT } from '@/components/explore-tab-new/courseled/tokens';
import { standingOrdinal } from './ordinal';
import { useFeatsWindow, type FeatWindow } from './useFeatsWindow';
import { useWhsConnection } from '@/lib/whs/hooks';
import { RoundsGate, roundsGateState } from './RoundsGate';
import { RARE_AIR, rareAirPlaceholderHeight } from './rareAir';
import { RareAirLede, RareAirRail, RareAirYou } from './RareAirSection';
import { GUTTER, Section, SeeAll } from './Section';
import { RailChips } from '@/components/ui/RailChips';
import { Top100ListProgressSheet } from '@/components/top100/sheets/Top100ListProgressSheet';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';
import { RANK_SCOPE_LABEL, type RankListSlug } from './useTop100RankIndex';
import { THE_HUNDRED, HUNDRED_ROWS_HEIGHT, HUNDRED_SLAB_HEIGHT, hundredPlaceholderHeight, hundredSlab } from './theHundred';
import { CLIMB, climbCross, climbOrder, climbPlaceholderHeight, type ClimbMode, type ClimbPlaced } from './climb';
import { formatMonthLong } from '@/i18n/format';
import { HundredBasis, HundredRail, HundredYou } from './TheHundredSection';

/** CompactRow value size (the Top 100 and improvement sections). */
export const ROW_VALUE_SIZE = SEASON_ROW_METRICS.figureSize;

/**
 * THE ROUNDS PAGE (BRIEF — THE LEADERBOARDS PAGE, structure A; EX1).
 *
 * EVERY SECTION ANSWERS A DIFFERENT QUESTION. Scope governs the three scoped
 * sections (Standout rounds, Competitions, Just played — EX1 replaced §3, the
 * lead board, with them) and nothing below them. Sections, in order: head
 * (scope chips), Standout rounds, Competitions, Just played, §5 Feats this
 * year, §4 Most improved, §7 Top 100 — the three below are
 * platform facts. The order alternates section SHAPE (rows,
 * tiles, rows, carousel) so no two neighbours read alike; anything added
 * here is placed by its shape, not its subject. § numbers name sections, not
 * positions. Each section owns its read, holds its
 * own height while pending, and renders NOTHING when its read fails or is empty.
 */

/* Phase 9.5 — the rail, control row, basis and you slab sit 16 in, as the rows do. */
const HEAD_GUTTER = 16;
const SLAB_BG = 'rgba(255,255,255,0.05)';
const SHORT_ROWS = 3;
/** Faint ink: no separate token exists; DIM is the faintest analytical ink. */
const FAINT = A.DIM;

/* ---------------------------------------------------------------- reads */

interface CareerRow {
  pos: number;
  is_tie: boolean;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  home_club: string | null;
  value: number;
  /** Read from get_career_leaderboard but deliberately UNRENDERED — §7 dropped
   * the field-average line; kept only so the SQL column isn't "fixed" back into the UI. */
  field_avg: number | null;
  /** Most recent round on a course in the SELECTED list — same scope as `value`. */
  last_course_name: string | null;
  /* `courses` (always null from the RPC, never rendered) is deliberately not typed. */
  total_members: number;
  is_viewer: boolean | null;
}

type CareerMetric =
  | 'top_100_gbni_distinct'
  | 'top_100_worldwide_distinct'
  | 'top_100_europe_distinct'
  | 'top_100_usa_distinct'
  | 'birdies' | 'rounds' | 'sub_80' | 'eagles'
  | 'best_stableford' | 'best_score_diff';

interface BoardSheetProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  subtitle: string;
  valueHeading: string;
  footnote?: string;
  above?: React.ReactNode;
  children: React.ReactNode;
}

/** THE ONE SEE-ALL SHELL on this page: Top 100 and Most improved. */
function BoardSheet({ open, onClose, titleId, title, subtitle, valueHeading, footnote, above, children }: BoardSheetProps) {
  const { t } = useTranslation('courses');
  const cap: React.CSSProperties = { fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' };
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      maxHeight="85dvh"
      ariaLabelledBy={titleId}
      style={{ height: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 13px', /* Hairline clause: sheet controls from list. */ borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id={titleId} style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, fontWeight: 700, color: A.INK }}>{title}</h2>
          <div style={{ ...cap, marginTop: 2, color: A.DIM }}>{subtitle}</div>
        </div>
        <button type="button" onClick={onClose} style={{ ...cap, flex: 'none', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: A.INK }}>
          {t('common.done')}
        </button>
      </div>
      {above}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px', fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM, flexShrink: 0 }}>
        <span>{t('amateur.leaderboards.member')}</span>
        <span>{valueHeading}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 32px' }}>
        {children}
        {footnote ? (
          <div style={{ fontFamily: SANS, fontSize: 11.5, lineHeight: 1.45, color: A.DIM, padding: '14px 0 8px' }}>{footnote}</div>
        ) : null}
      </div>
    </BottomSheet>
  );
}

function useCareerBoard(
  viewerId: string | undefined,
  metric: CareerMetric,
  limit: number,
  rpc: 'get_career_leaderboard' | 'get_year_leaderboard' = 'get_career_leaderboard',
  enabled = true,
) {
  return useQuery<CareerRow[]>({
    queryKey: ['leaderboards', rpc, viewerId ?? 'anon', metric, limit],
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
    /* A metric change is a new key; keep the previous rows on screen until
     * the next list arrives so the section never drops to its skeleton. */
    placeholderData: (prev) => prev,
    queryFn: async () => {
      /* Bound to the client: supabase.rpc reads `this.rest`. */
      const { data, error } = await (supabase.rpc as unknown as (
        f: string,
        a: Record<string, unknown>,
      ) => Promise<{ data: CareerRow[] | null; error: unknown }>).call(supabase, rpc, {
        p_viewer: viewerId ?? null,
        p_metric: metric,
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

interface ImprovementRow {
  pos: number;
  is_tie: boolean;
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  start_index: number | null;
  current_index: number | null;
  improvement: number | null;
  started_on: string | null;
  total_members: number;
  is_viewer: boolean | null;
}

/** §4 — cumulative cut this year, all members (the RPC takes no scope). An
 *  error (e.g. the function missing) hides the section rather than erroring. */
function useYearImprovement(viewerId: string | undefined) {
  return useQuery<ImprovementRow[]>({
    queryKey: ['leaderboards', 'year-improvement', viewerId ?? 'anon'],
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        f: string,
        a: Record<string, unknown>,
      ) => Promise<{ data: ImprovementRow[] | null; error: unknown }>).call(supabase, 'get_year_improvement_leaderboard', {
        p_viewer: viewerId ?? null,
        p_limit: 100,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * §7 — THE ONE PLACE A TOP 100 CHIP MEETS ITS METRIC. Chip order is the map's
 * key order. NOTE THE ONE MISMATCH: the chip reads "Global" (RANK_SCOPE_LABEL,
 * the app's published name) while the metric key says "worldwide" (the
 * database's name). Neither changes here; they meet only on this line.
 */
const TOP100_METRIC: Record<RankListSlug, CareerMetric> = {
  'gb-i': 'top_100_gbni_distinct',
  global: 'top_100_worldwide_distinct',
  europe: 'top_100_europe_distinct',
  usa: 'top_100_usa_distinct',
};
const TOP100_ORDER = Object.keys(TOP100_METRIC) as RankListSlug[];
/** The list with the most members, and the one the section always showed. */
const TOP100_DEFAULT: RankListSlug = 'gb-i';

/** Fewer ranked rows is not a board — the shared BOARD_ROW_FLOOR. */
const THIN_FLOOR = BOARD_ROW_FLOOR;


/* ------------------------------------------------------------ furniture */


/** §4 order toggle — Rare air's shape, read from RARE_AIR.toggle. */
function ClimbToggle({ mode, onChange }: { mode: ClimbMode; onChange: (m: ClimbMode) => void }) {
  const { t } = useTranslation('courses');
  return (
    <div
      role="radiogroup"
      aria-label={t('amateur.leaderboards.climbOrder')}
      style={{
        display: 'flex', gap: RARE_AIR.toggle.gap, padding: RARE_AIR.toggle.padding, borderRadius: 999, flex: 'none', alignSelf: 'center',
        background: RARE_AIR.toggle.background, border: `1px solid ${RARE_AIR.toggle.border}`,
      }}
    >
      {(['strokes', 'share'] as const).map((key) => {
        const selected = mode === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => { if (!selected) onChange(key); }}
            style={{
              height: RARE_AIR.toggle.height, padding: `0 ${RARE_AIR.toggle.sidePadding}px`, borderRadius: 999, border: 'none',
              fontFamily: SANS, fontSize: RARE_AIR.toggle.fontSize, fontWeight: 600, whiteSpace: 'nowrap',
              letterSpacing: 'normal', textTransform: 'none',
              background: selected ? RARE_AIR.toggle.fill : 'transparent',
              color: selected ? A.INK : A.MUTE,
            }}
          >
            {t(key === 'strokes' ? 'amateur.leaderboards.climbStrokes' : 'amateur.leaderboards.climbShare')}
          </button>
        );
      })}
    </div>
  );
}

function CompactRow({
  pos,
  tie,
  id,
  name,
  avatarName,
  photo,
  secondary,
  value,
  caption,
  progress,
  captionTone,
  valueTone,
  self,
  gapAbove,
  onPress,
}: {
  pos: number | null;
  tie: boolean;
  id: string;
  name: string;
  /** The member's real name, for initials; `name` may be placeholder copy. */
  avatarName: string | null | undefined;
  photo: string | null;
  secondary: string | null;
  value: string;
  caption?: string | null;
  /** OPTIONAL 0–1 bar under the name (Top 100 only). Absent = the row as before. */
  progress?: number;
  /** The caption's semantic colour, on every row including the viewer's. */
  captionTone?: string;
  valueTone?: string;
  self: boolean;
  /** The pinned self row: a 12px break above it, plus the self tint (9.13). */
  gapAbove?: boolean;
  onPress: () => void;
}) {
  /* THE FIGURE NEVER TAKES AMBER. Amber marks WHICH ROW IS YOURS, through the
     position, the name and the tint (and the progress fill). A figure's colour
     means what the figure means — green for a cut, red for under par — and a
     member's own figure is the one they most want to read correctly. So the
     figure reads valueTone (else A.INK) and the caption captionTone (else
     A.DIM), whoever's row it is. BoardRowView carries the same law. */
  const ink = self ? A.AMBER : A.INK;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: SEASON_ROW_METRICS.colGap,
        padding: `${SEASON_ROW_METRICS.padY}px 0`,
        border: 'none',
        /* 9.13 — a hairline beneath every row, the last included. */
        borderBottom: `${SEASON_ROW_METRICS.hairline}px solid ${A.SOFT}`,
        marginTop: gapAbove ? SEASON_ROW_METRICS.pinnedGap : 0,
        background: self ? SELF_ROW_TINT : 'transparent',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      <span
        className="tabular-nums"
        style={{ width: SEASON_ROW_METRICS.posTrack, flexShrink: 0, textAlign: 'center', fontSize: SEASON_ROW_METRICS.posSize, fontWeight: SEASON_ROW_METRICS.posWeight, color: self ? A.AMBER : A.MUTE }}
      >
        {pos == null ? '\u2014' : tie ? `T${pos}` : pos}
      </span>
      <span style={{ flexShrink: 0 }}>
        <MemberAvatar userId={id} name={avatarName} photoUrl={photo} size={SEASON_ROW_METRICS.avatar} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: SEASON_ROW_METRICS.nameSize,
            fontWeight: SEASON_ROW_METRICS.nameWeight,
            lineHeight: SEASON_ROW_METRICS.nameLine,
            color: ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        {secondary ? (
          <span
            style={{
              display: 'block',
              marginTop: SEASON_ROW_METRICS.subGap,
              fontSize: SEASON_ROW_METRICS.subSize,
              fontWeight: SEASON_ROW_METRICS.subWeight,
              lineHeight: SEASON_ROW_METRICS.subLine,
              color: A.DIM,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {secondary}
          </span>
        ) : null}
        {progress != null ? (
          <span
            aria-hidden
            data-row-progress
            style={{ display: 'block', marginTop: THE_HUNDRED.row.progress.marginTop, height: THE_HUNDRED.row.progress.height, borderRadius: SEASON_ROW_METRICS.barRadius, background: THE_HUNDRED.row.progress.background, overflow: 'hidden' }}
          >
            <span style={{ display: 'block', width: `${Math.max(0, Math.min(1, progress)) * 100}%`, height: '100%', background: self ? A.AMBER : THE_HUNDRED.row.progress.fill }} />
          </span>
        ) : null}
      </span>
      <span style={{ flexShrink: 0, textAlign: 'right' }}>
        <span className="tabular-nums" style={{ display: 'block', fontSize: ROW_VALUE_SIZE, fontWeight: SEASON_ROW_METRICS.figureWeight, letterSpacing: SEASON_ROW_METRICS.figureTracking, lineHeight: caption ? SEASON_ROW_METRICS.figureLine : undefined, color: valueTone ?? A.INK }}>
          {value}
        </span>
        {caption ? (
          <span className="tabular-nums" style={{ display: 'block', fontSize: SEASON_ROW_METRICS.secondarySize, fontWeight: SEASON_ROW_METRICS.secondaryWeight, lineHeight: SEASON_ROW_METRICS.secondaryLine, color: captionTone ?? A.DIM }}>
            {caption}
          </span>
        ) : null}
      </span>
    </button>
  );
}


/* ---------------------------------------------------------------- page */

export function ScoresLeaderboardsPage({
  userId,
  state,
  onRowPress,
  onMemberTap,
  onOpenCourse,
}: {
  userId: string | undefined;
  state: AmateurBoardState;
  /** EX1: unused since the Filters pill was unmounted; kept optional so the pill can be re-mounted without re-plumbing. */
  onOpenFilters?: () => void;
  onRowPress: (row: RoundPressTarget) => void;
  /** Resolves to compare, nudge or invite via useMemberTapResolver. NOT a profile page — the Top 100 sheet's Profile pill navigates to /profile/:id itself. */
  onMemberTap: (userId: string) => void;
  onOpenCourse: (courseId: string) => void;
}) {
  const { t, i18n } = useTranslation('courses');
  const nameOf = (n: string | null | undefined) => n || t('discover.aMember');
  const scope = state.filters.scope;


  /* §4 — most improved this year, all members. Scope does not apply. */
  const improved = useYearImprovement(userId);
  const improvedRows = improved.data ?? [];
  const [improvedSheet, setImprovedSheet] = useState(false);
  const [climbMode, setClimbMode] = useState<ClimbMode>('strokes');

  const [featWindow, setFeatWindow] = useState<FeatWindow>('year');
  const featsYear = useFeatsWindow(userId, featWindow);
  /* B.2 — the year view compares against all time, and the rarity bar always
     reads all time. On the all-time view the primary read IS that read. */
  const featsAll = useFeatsWindow(userId, 'all', featWindow === 'year');
  const featAllRows = (featWindow === 'all' ? featsYear.data : featsAll.data) ?? [];
  /** Feat tiles are counted in the section's own window, so their sheets open on the same one. */
  const featFilters: BoardFilters = { ...DEFAULT_FILTERS, window: featWindow };
  const pickFeatWindow = (next: FeatWindow) => {
    if (next === featWindow) return;
    setFeatWindow(next);
    analyticsEvents.track('feats_window_changed', { window: next });
  };

  const [top100List, setTop100List] = useState<RankListSlug>(TOP100_DEFAULT);
  const top100 = useCareerBoard(userId, TOP100_METRIC[top100List], 100);
  const top100Defaulted = top100List === TOP100_DEFAULT;
  const pickTop100 = (next: string) => {
    const slug = next as RankListSlug;
    if (slug === top100List) return;
    /* Reuses the "a chip changed the list" event rather than naming it twice. */
    analyticsEvents.track('amateur_board_changed', { board: `top100:${slug}`, list: slug });
    setTop100List(slug);
  };

  const [seeAll, setSeeAll] = useState<{ board: BoardKey; filters: BoardFilters } | null>(null);
  const [top100SeeAllSheet, setTop100SeeAllSheet] = useState(false);

  /* CB13 — THE HANDICAP GATE. The one added read: the member's own connection
     (the same useWhsConnection every other surface shares, so it is usually
     already cached). The four states and the predicate live in RoundsGate.tsx.
     The page's own queries are untouched: gated, they run live behind the
     frost; connected, nothing changes. */
  const connection = useWhsConnection(userId);
  const gate = roundsGateState(userId, connection);

  /* 3.3 ONE WINDOW VOCABULARY: WINDOW_OPTIONS (the filter list's own words)
     is the eyebrow too; WINDOW_SHORT survives only as its compact form for the
     middot sample line, where the phrase follows a count ("19 members · 14 days"). */
  const windowLabel = (w: WindowKey) => {
    const o = WINDOW_OPTIONS.find((x) => x.key === w) ?? WINDOW_OPTIONS[0];
    return t(o.i18n);
  };

  const membersText = (n: number) =>
    t('amateur.leaderboards.nMembers', { count: n });
  // Deliberately uncounted: "See all members" without a figure everywhere.
  const seeAllMembers = () => t('amateur.leaderboards.seeAllMembers');

  /* §4 row. start_index and current_index are FACTS from the RPC, so they are
     formatted directly — handicapJourneyDisplay derives an after-value from a
     round's delta and must not be used to re-derive numbers we already have. */
  const improvedRow = (p: ClimbPlaced<ImprovementRow>, inSheet: boolean) => {
    const r = p.row;
    const pair = handicapPairDisplay({
      handicapIndex: r.current_index,
      deltaIndex: r.improvement == null ? null : -Number(r.improvement),
    });
    const month = r.started_on
      ? (() => { const d = playDateAtLocalNoon(r.started_on); return d ? formatMonthLong(d) : null; })()
      : null;
    const journey =
      r.start_index != null && r.current_index != null
        ? `${fmtHcp(Number(r.start_index))} \u2192 ${fmtHcp(Number(r.current_index))}${month ? ` ${t('amateur.leaderboards.since', { month })}` : ''}`
        : null;
    /* C.3 — both figures on every row; the order decides which is main. */
    const imp = r.improvement == null ? null : Number(r.improvement);
    const cut = pair?.delta ? `${pair.delta.arrow}${pair.delta.text}` : '\u2014';
    const pct = p.share == null ? null : Math.round(Math.abs(p.share) * 100);
    const shareMain = pct == null ? '\u2014' : `${pair?.delta?.arrow ?? ''}${pct}%`;
    const strokesSecondary = pct == null ? '\u2014' : t('amateur.leaderboards.climbOfIndex', { n: pct });
    const shareSecondary = imp == null
      ? '\u2014'
      : t('amateur.leaderboards.climbStrokesCut', { n: `${imp > 0 ? '\u2212' : imp < 0 ? '+' : ''}${Math.abs(imp).toFixed(1)}` });
    const onShare = climbMode === 'share';
    return (
      <CompactRow
        key={r.user_id}
        pos={p.pos}
        tie={p.tie}
        id={r.user_id}
        name={nameOf(r.display_name)}
        avatarName={r.display_name}
        photo={r.photo_url}
        secondary={journey}
        value={onShare ? shareMain : cut}
        valueTone={onShare && pct == null ? undefined : pair?.delta?.tone}
        caption={onShare ? shareSecondary : strokesSecondary}
        self={!!r.is_viewer || r.user_id === userId}
        onPress={() => {
          if (inSheet) setImprovedSheet(false);
          onMemberTap(r.user_id);
        }}
      />
    );
  };
  const climbPlaced = climbOrder(improvedRows, climbMode);
  const climbOrd = (pos: number, tie: boolean) => `${tie ? 'T' : ''}${standingOrdinal(pos, i18n?.language ?? 'en')}`;
  const climbSentence = (() => {
    const c = climbCross(improvedRows, climbMode, userId);
    if (c.kind === 'none') return null;
    const base = climbMode === 'strokes' ? 'amateur.leaderboards.climbCross.strokes' : 'amateur.leaderboards.climbCross.share';
    return c.kind === 'first'
      ? t(`${base}.first`, { pos: climbOrd(c.pos, c.tie) })
      : t(`${base}.better`, { pos: climbOrd(c.pos, c.tie), otherPos: climbOrd(c.otherPos, c.otherTie) });
  })();


  /* ------------------------------------------------------------ §5 feats */
  /* §5 reads get_feats_window: true event counts (eagles, not rounds with an
     eagle) and the denominator each divides by, from one RPC row per kind. */
  const featRows = featsYear.data ?? [];
  // B.8 — nothing vanishes: all four feats, in RPC order, every window.
  const featTotals = featsYear.isSuccess ? featRows[0] ?? null : null;
  // First load only: isFetched drops on key change while placeholderData holds rows; isSuccess does not.
  const featsFirstLoad = !featsYear.isSuccess && featRows.length === 0;

  /* ------------------------------------------------- §7 short board */
  const shortBoard = (
    rows: CareerRow[],
    secondary: (r: CareerRow) => string | null,
    caption: string | undefined,
    onPress: (r: CareerRow) => void = (r) => onMemberTap(r.user_id),
    opts: { all?: boolean; fmt?: (r: CareerRow) => string; progress?: (r: CareerRow) => number | undefined } = {},
  ) => {
    const top = opts.all ? rows : rows.slice(0, SHORT_ROWS);
    const mine = rows.find((r) => r.is_viewer) ?? (userId ? rows.find((r) => r.user_id === userId) : undefined);
    const pin = mine && !top.some((r) => r.user_id === mine.user_id) ? mine : null;
    const list = pin ? [...top, pin] : top;
    return list.map((r, i) => (
      <CompactRow
        key={r.user_id}
        pos={r.pos}
        tie={r.is_tie}
        id={r.user_id}
        name={nameOf(r.display_name)}
        avatarName={r.display_name}
        photo={r.photo_url}
        secondary={secondary(r)}
        value={opts.fmt ? opts.fmt(r) : String(r.value)}
        caption={caption}
        progress={opts.progress?.(r)}
        self={!!r.is_viewer || r.user_id === userId}
        /* The pinned self row: 12px gap above, amber self tint (Phase 9.13). */
        gapAbove={!!pin && r.user_id === pin.user_id && i === list.length - 1}
        onPress={() => onPress(r)}
      />
    ));
  };

  const top100Rows = top100.data ?? [];
  /* last_course_name is scoped in SQL to the selected list, so it changes with
     the chip alongside the count. Never fall back to home_club. T.3 — the bare
     course name; the basis sentence says what the line is. */
  const top100Secondary = (r: CareerRow): string | null => r.last_course_name || null;
  /* Same call as the progress sheet (same query key) — the sheet opens from cache. */
  const listCourses = useTop100ListProgress(userId ? top100List : undefined, userId, userId);
  const listTiles = useMemo(
    () => [...(listCourses.data ?? [])].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
    [listCourses.data],
  );
  /** The list's length is the fetched list's row count, never a literal 100. */
  const listLength = listCourses.isSuccess && listTiles.length > 0 ? listTiles.length : null;
  const top100Progress = (r: CareerRow): number | undefined =>
    listLength != null ? Math.min(1, Number(r.value) / listLength) : undefined;
  const [top100Sheet, setTop100Sheet] = useState<CareerRow | null>(null);
  const openTop100Sheet = (r: CareerRow) => setTop100Sheet(r);

  const pending = (h: number) => <div aria-hidden style={{ height: h, marginInline: GUTTER, marginBottom: 24 }} />;

  /* CB13 state 2 — the connection read has not settled (or failed): hold the
     page's own loading treatment. The scoped sections render nothing while
     pending today, so the shell is the control row plus the three section
     placeholders, exactly what a first paint already shows. */
  if (gate === 'loading') {
    return (
      <div style={{ fontFamily: SANS }}>
        {state.ready ? (
          <div data-scores-control-row style={{ display: 'flex', alignItems: 'center', gap: 9, padding: `0 ${HEAD_GUTTER}px 12px` }}>
            <ScopeSegments scope={scope} clubApplies={state.clubApplies} onScopeChange={state.changeScope} style={{ flex: 1, minWidth: 0 }} />
          </div>
        ) : null}
        {pending(rareAirPlaceholderHeight(!!userId))}
        {pending(climbPlaceholderHeight(SHORT_ROWS))}
        {pending(hundredPlaceholderHeight(!!userId))}
      </div>
    );
  }

  const pageBody = (
    <div style={{ fontFamily: SANS }}>
      {/* EX1 — THE BOARDS ARE UNMOUNTED, NOT DELETED: the board chip rail, its
          rows, the basis sentence, the you slab and the Filters pill no longer
          render here. BoardRows, BoardFilterPanel, BoardSeeAllSheet,
          boardFilters, useBoardPage and useBoardFacets stay on disk; restoring
          a board is re-adding a mount. The scope chips stay and drive
          Standout rounds, Competitions and Just played. */}
      {state.ready ? (
        <>
          <div data-scores-control-row style={{ display: 'flex', alignItems: 'center', gap: 9, padding: `0 ${HEAD_GUTTER}px 12px` }}>
            <ScopeSegments scope={scope} clubApplies={state.clubApplies} onScopeChange={state.changeScope} style={{ flex: 1, minWidth: 0 }} />
          </div>
          <StandoutRounds viewerId={userId} filters={state.filters} enabled={state.ready} onRowPress={onRowPress} />
          <CompetitionBoards viewerId={userId} scope={state.filters.scope} enabled={state.ready} onRowPress={onRowPress} />
          <JustPlayed viewerId={userId} filters={state.filters} enabled={state.ready} onRowPress={onRowPress} />
        </>
      ) : null}

      {/* §5 FEATS THIS YEAR — event counts; footnote is distinct members. */}
      {/* §5 RARE AIR — all four feats rarest first; hides only on zero rounds. */}
      {featsFirstLoad ? (
        pending(rareAirPlaceholderHeight(!!userId))
      ) : featTotals && featTotals.total_rounds > 0 ? (
        <Section
          contest={false}
          eyebrow={t('amateur.leaderboards.rareAir')}
          title={t('amateur.leaderboards.feats')}
          metaAlign="center"
          meta={(
            <div
              role="radiogroup"
              aria-label={t('amateur.leaderboards.featsWindow')}
              style={{
                display: 'flex', gap: RARE_AIR.toggle.gap, padding: RARE_AIR.toggle.padding, borderRadius: 999, flex: 'none', alignSelf: 'center',
                background: RARE_AIR.toggle.background, border: `1px solid ${RARE_AIR.toggle.border}`,
              }}
            >
              {([
                ['year', String(new Date().getFullYear())],
                ['all', t('amateur.leaderboards.allTime')],
              ] as const).map(([key, label]) => {
                const selected = featWindow === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pickFeatWindow(key)}
                    style={{
                      height: RARE_AIR.toggle.height, padding: `0 ${RARE_AIR.toggle.sidePadding}px`, borderRadius: 999, border: 'none',
                      fontFamily: SANS, fontSize: RARE_AIR.toggle.fontSize, fontWeight: 600, whiteSpace: 'nowrap',
                      letterSpacing: 'normal', textTransform: 'none',
                      background: selected ? RARE_AIR.toggle.fill : 'transparent',
                      color: selected ? A.INK : A.MUTE,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          ledeStyle={{ fontSize: RARE_AIR.lede.fontSize, lineHeight: RARE_AIR.lede.lineHeight }}
          lede={<RareAirLede totals={featTotals} window={featWindow} />}
        >
          {userId ? <RareAirYou rows={featRows} locale={i18n?.language} /> : null}
          <RareAirRail
            rows={featRows}
            allRows={featAllRows}
            window={featWindow}
            locale={i18n?.language}
            onOpen={(key) => setSeeAll({ board: key, filters: featFilters })}
          />
        </Section>
      ) : null}

      {/* §4 MOST IMPROVED — cumulative this year, not a single round's cut. */}
      {improved.isPending ? (
        pending(climbPlaceholderHeight(SHORT_ROWS))
        /* Below THIN_FLOOR the section renders nothing, deliberately: a three-row improvement board is not a board. */
      ) : improved.isSuccess && improvedRows.length >= THIN_FLOOR ? (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.climb')}
          title={t('amateur.leaderboards.mostImproved')}
          metaAlign="center"
          meta={<ClimbToggle mode={climbMode} onChange={setClimbMode} />}
        >
          {climbPlaced.slice(0, SHORT_ROWS).map((p) => improvedRow(p, false))}
          {climbSentence ? (
            <div
              data-climb-cross
              style={{
                position: 'relative', marginTop: CLIMB.slab.marginTop, padding: CLIMB.slab.padding, paddingLeft: 14.5,
                borderRadius: CLIMB.slab.radius, overflow: 'hidden', background: SLAB_BG,
                fontSize: CLIMB.slab.fontSize, lineHeight: CLIMB.slab.lineHeight, color: A.MUTE,
              }}
            >
              <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: CLIMB.slab.bar, background: A.AMBER }} />
              {climbSentence}
            </div>
          ) : null}
          <SeeAll
            label={seeAllMembers()}
            onPress={() => setImprovedSheet(true)}
          />
        </Section>
      ) : null}

      {/* §6 Who leads what removed — CB11. */}

      {/* §7 TOP 100 — get_career_leaderboard(TOP100_METRIC[list]). This section
          is get_career_leaderboard's ONLY consumer; its other branches
          (including 'crowns') stay in SQL, dormant.
          NO THIN FLOOR ON A LIST THE MEMBER CHOSE: once a chip is tapped, any
          row count is shown and zero rows reads one quiet line. Only the
          DEFAULT list being empty (or failing) on load hides the section. */}
      {top100Defaulted && top100.isPending ? (
        /* No pinned row: the skeleton cannot know if the viewer is in the top 3,
           and the shorter shape grows downward (expand-outwards-only). */
        pending(hundredPlaceholderHeight(!!userId))
      ) : top100Defaulted && !(top100.isSuccess && top100Rows.length > 0) ? null : (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.theHundred')}
          title={t('amateur.leaderboards.top100')}
        >
          {/* §7 head is eyebrow + title only — meta (member count) and lede
              (field average) were dropped; See all is the only count surface. */}
          <div style={{ marginBottom: THE_HUNDRED.blockGap }}>
            <RailChips
              align="center-when-fit"

              ground="filled-selection"
              options={TOP100_ORDER.map((slug) => ({ id: slug, label: RANK_SCOPE_LABEL[slug] }))}
              value={top100List}
              onChange={pickTop100}
              ariaLabel={t('amateur.leaderboards.top100List')}
            />
          </div>
          {/* T.1 THE YOU SLAB — signed in only. Needs the board (n, pos, gap)
              and the list (its length), so it holds its height until both land. */}
          {userId ? (
            top100.isPending || listCourses.isPending ? (
              <div aria-hidden style={{ height: HUNDRED_SLAB_HEIGHT, marginBottom: THE_HUNDRED.blockGap }} />
            ) : listLength != null ? (
              <HundredYou
                slab={hundredSlab(top100Rows, userId)}
                list={RANK_SCOPE_LABEL[top100List]}
                listLength={listLength}
                leaderValue={top100Rows.length > 0 ? Number(top100Rows[0].value) : 0}
                nameOf={nameOf}
              />
            ) : null
          ) : null}
          <HundredBasis list={RANK_SCOPE_LABEL[top100List]} />
          {/* A chip tap starts a fresh slug query. While it loads, reserve the
              tile row instead of holding the old list:
              last list's photographs under the new list's chip is worse than
              a brief empty rail. Deliberately NOT placeholderData. */}
          {userId && listCourses.isPending ? (
            <div style={{ marginBottom: THE_HUNDRED.blockGap }}>
              <div aria-hidden style={{ height: THE_HUNDRED.tile.height }} />
            </div>
          ) : listCourses.isSuccess && listTiles.length > 0 ? (
            <div style={{ marginBottom: THE_HUNDRED.blockGap }}>
              {/* Keyed by list: a new list remounts the rail, which sets its scroll once. */}
              <HundredRail key={top100List} tiles={listTiles} gutter={GUTTER} onOpenCourse={onOpenCourse} />
            </div>
          ) : null}
          {top100.isPending ? (
            <div style={{ minHeight: HUNDRED_ROWS_HEIGHT }} />
          ) : top100Rows.length === 0 ? (
            <p style={{ margin: 0, padding: THE_HUNDRED.empty.padding, fontFamily: SANS, fontSize: THE_HUNDRED.empty.fontSize, color: A.MUTE }}>
              {t('amateur.leaderboards.top100Empty')}
            </p>
          ) : (
            shortBoard(top100Rows, top100Secondary, undefined, openTop100Sheet, { progress: top100Progress })
          )}
          {top100Rows.length > SHORT_ROWS ? (
            <SeeAll label={seeAllMembers()} onPress={() => setTop100SeeAllSheet(true)} />
          ) : null}
        </Section>
      )}

      {seeAll ? (
        <BoardSeeAllSheet
          open
          onClose={() => setSeeAll(null)}
          userId={userId}
          board={seeAll.board}
          filters={seeAll.filters}
          appliedParts={describeFilterParts(seeAll.filters, t as never)}
          title={t(BOARD_LABELS[seeAll.board].i18n)}
          onRowPress={onRowPress}
        />
      ) : null}

      <BoardSheet
        open={improvedSheet}
        onClose={() => setImprovedSheet(false)}
        titleId="improved-see-all-title"
        title={t('amateur.leaderboards.mostImproved')}
        subtitle={improvedRows.length > 0
          ? `${t('amateur.leaderboards.improvedScope')} · ${membersText(Number(improvedRows[0].total_members) || improvedRows.length)}`
          : t('amateur.leaderboards.improvedScope')}
        valueHeading={t(climbMode === 'strokes' ? 'amateur.leaderboards.climbStrokes' : 'amateur.leaderboards.climbShare')}
        footnote={`${t('amateur.leaderboards.improvedQualifier')} ${t('amateur.leaderboards.climbPlusExcluded')}`}
        above={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px', borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
            <ClimbToggle mode={climbMode} onChange={setClimbMode} />
          </div>
        )}
      >
        {climbPlaced.map((p) => improvedRow(p, true))}
      </BoardSheet>

      <BoardSheet
        open={top100SeeAllSheet}
        onClose={() => setTop100SeeAllSheet(false)}
        titleId="top100-see-all-title"
        title={t('amateur.leaderboards.top100')}
        subtitle={top100Rows.length > 0
          ? `${RANK_SCOPE_LABEL[top100List]} · ${membersText(Number(top100Rows[0].total_members))}`
          : RANK_SCOPE_LABEL[top100List]}
        /* T.4 — the list's length from the same read the rail uses; no literal. */
        valueHeading={listLength != null
          ? t('amateur.leaderboards.coursesOfList', { n: listLength })
          : t('amateur.leaderboards.coursesPlayed')}
        above={
        <div style={{ padding: THE_HUNDRED.sheetChips.padding, /* Hairline clause: controls from list. */ borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
          <RailChips
            align="center-when-fit"
            ground="filled-selection"
            options={TOP100_ORDER.map((slug) => ({ id: slug, label: RANK_SCOPE_LABEL[slug] }))}
            value={top100List}
            onChange={pickTop100}
            ariaLabel={t('amateur.leaderboards.top100List')}
          />
        </div>
        }
      >
          {top100Rows.map((r) => (
            <CompactRow
              key={r.user_id}
              pos={r.pos}
              tie={r.is_tie}
              id={r.user_id}
              name={nameOf(r.display_name)}
              avatarName={r.display_name}
              photo={r.photo_url}
              secondary={top100Secondary(r)}
              value={String(r.value)}
              progress={top100Progress(r)}
              self={!!r.is_viewer || r.user_id === userId}
              onPress={() => {
                setTop100SeeAllSheet(false);
                openTop100Sheet(r);
              }}
            />
          ))}
      </BoardSheet>

      {top100Sheet ? (
        <Top100ListProgressSheet
          open
          onClose={() => setTop100Sheet(null)}
          listSlug={top100List}
          ownerUserId={top100Sheet.user_id}
          ownerName={nameOf(top100Sheet.display_name)}
          ownerPhotoUrl={top100Sheet.photo_url}
          standing={{ place: top100Sheet.pos, fieldSize: Number(top100Sheet.total_members) }}
        />
      ) : null}
    </div>
  );

  /* CB13 states 1 and 4 return the page untouched; state 3 frosts it. */
  if (gate === 'gated') return <RoundsGate>{pageBody}</RoundsGate>;
  return pageBody;
}
