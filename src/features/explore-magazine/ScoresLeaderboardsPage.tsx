import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { ChevronRight, Medal } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { MemberAvatar } from '@/components/explore-tab-new/courseled/MemberAvatar';
import { ROW_METRICS } from '@/components/explore-tab-new/courseled/rowMetrics';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { BoardHeaderRow, BoardRowView, boardColumns, fmtToPar } from '@/components/explore-tab-new/courseled/BoardRows';
import { describeFilterParts } from '@/components/explore-tab-new/courseled/describeFilters';
import { type BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import {
  BOARD_LABELS,
  DEFAULT_FILTERS,
  OFFERED_RANKING_BOARD_KEYS,
  BOARD_ROW_FLOOR,
  WINDOW_OPTIONS,
  boardCountsRounds,
  type BoardFilters,
  type BoardKey,
  type FeatBoardKey,
  type WindowKey,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { REC } from '@/components/profile/handicap/whs/gam/trophy-room/career/tokens';
import { MEDAL_BRONZE, MEDAL_GOLD, MEDAL_SILVER } from '@/lib/tokens/medals';
import { entryFiltersFor, type AmateurBoardState } from '@/features/amateur/useAmateurBoardState';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { FiltersPill, ScopeSegments } from './ScoresFilterHead';
import { handicapPairDisplay } from './circleHandicap';
import { fmtHcp } from '@/lib/whs/format';
import { BOARD_FLOOR_COPY } from '@/components/explore-tab-new/courseled/boardFloors';
import { playDateAtLocalNoon } from '@/components/explore-tab-new/courseled/discoverWhen';
import { useFeatsWindow, type FeatKind, type FeatWindow } from './useFeatsWindow';
import { RailChips } from '@/components/ui/RailChips';
import { Top100ListProgressSheet } from '@/components/top100/sheets/Top100ListProgressSheet';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';
import { RANK_SCOPE_LABEL, type RankListSlug } from './useTop100RankIndex';

/** CompactRow value size (the career, Top 100 and improvement sections). */
export const ROW_VALUE_SIZE = ROW_METRICS.figureSize;

/**
 * THE LEADERBOARDS PAGE (BRIEF — THE LEADERBOARDS PAGE, structure A).
 *
 * EVERY SECTION ANSWERS A DIFFERENT QUESTION. Scope governs the lead board
 * (§3 Lowest gross) and nothing below it. Sections, in order: head, §3 Lowest
 * gross, §5 Feats this year, §7 Top 100, §6 Who leads what, §4 Most improved
 * — §4 onward are platform facts. The order alternates section SHAPE (rows,
 * tiles, carousel, rail, rows) so no two neighbours read alike; anything added
 * here is placed by its shape, not its subject. § numbers name sections, not
 * positions. Each section owns its read, holds its
 * own height while pending, and renders NOTHING when its read fails or is empty.
 */

const GUTTER = 16;
/* Phase 8 head geometry: the rail, control row, basis and you slab sit 14 in. */
const HEAD_GUTTER = 14;
const CHIP_BG = 'rgba(255,255,255,0.04)';
const CHIP_ACTIVE_BG = 'rgba(247,147,30,0.1)';
const CHIP_ACTIVE_BORDER = 'rgba(247,147,30,0.55)';
const SLAB_BG = 'rgba(255,255,255,0.05)';
const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};
/* Interpolation markers: a styled phrase is spliced in after translation. */
const MARK_W = '\u0001W\u0001';
const MARK_U = '\u0001U\u0001';
const MARK_Y = '\u0001Y\u0001';
function splitMarks(text: string, map: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\u0001[A-Z]\u0001)/).map((part, i) =>
    part in map ? <span key={i}>{map[part]}</span> : part,
  );
}
const LEAD_POSITIONS = 5;
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
  courses: number | null;
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

/** get_year_leaderboard.value is numeric, so it arrives as a string. The ONE
 *  per-metric formatter: a differential carries one decimal and an explicit
 *  sign; every other metric is an integer. */
function fmtCareerValue(metric: CareerMetric, v: number | string | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '\u2014';
  if (metric === 'best_score_diff') return `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n).toFixed(1)}`;
  return String(Math.round(n));
}

/** Leader's distance from second, whichever way the board counts. */
function fmtCareerMargin(metric: CareerMetric, a: number | string, b: number | string): { zero: boolean; text: string } {
  const d = Math.abs(Number(a) - Number(b));
  const text = metric === 'best_score_diff' ? d.toFixed(1) : String(Math.round(d));
  return { zero: Number(text) === 0, text };
}

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

/** THE ONE SEE-ALL SHELL on this page: Top 100, Most improved and every §6 tile. */
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
) {
  return useQuery<CareerRow[]>({
    queryKey: ['leaderboards', rpc, viewerId ?? 'anon', metric, limit],
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
/** §6 rail fetch: the tile reads two rows, the sheet the field. */
const CAREER_RAIL_LIMIT = 100;

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

const EYEBROW = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
};

function Section({
  eyebrow,
  contest,
  title,
  meta,
  metaAlign,
  first,
  lede,
  children,
}: {
  eyebrow: string;
  contest: boolean;
  title: ReactNode;
  meta?: ReactNode;
  /** 'center' for a control in the meta slot — the row is baseline-aligned for text. */
  metaAlign?: 'center';
  first?: boolean;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        fontFamily: SANS,
        paddingInline: GUTTER,
        marginTop: 0, // first section: the tab strip's own gap is the seam (matches All / Watch)
        paddingTop: first ? 0 : 24,
        borderTop: first ? 'none' : `1px solid ${A.SOFT}`,
        marginBottom: 24,
      }}
    >
      <div style={{ ...EYEBROW, color: contest ? A.AMBER : A.DIM }}>{eyebrow}</div>
      <div
        style={{
          marginTop: 5,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK }}>
          {title}
        </div>
        {meta != null ? (
          <div className="tabular-nums" style={{ ...EYEBROW, color: A.DIM, flexShrink: 0, whiteSpace: 'nowrap', alignSelf: metaAlign }}>
            {meta}
          </div>
        ) : null}
      </div>
      {lede != null ? (
        <div style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.45, color: A.MUTE }}>{lede}</div>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function SeeAll({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        marginTop: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: 0,
        border: 'none',
        background: 'transparent',
        fontFamily: SANS,
        ...EYEBROW,
        color: A.MUTE,
        cursor: 'pointer',
      }}
    >
      {label}
      <ChevronRight size={13} />
    </button>
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
  captionTone,
  valueTone,
  self,
  gapAbove,
  onPress,
}: {
  pos: number;
  tie: boolean;
  id: string;
  name: string;
  /** The member's real name, for initials; `name` may be placeholder copy. */
  avatarName: string | null | undefined;
  photo: string | null;
  secondary: string | null;
  value: string;
  caption?: string | null;
  /** Ignored on the viewer's own row: amber identity outranks par tone. */
  captionTone?: string;
  valueTone?: string;
  self: boolean;
  /** Phase 5.2 — a broken sequence (the pinned self row) is marked by space, not a line. */
  gapAbove?: boolean;
  onPress: () => void;
}) {
  const ink = self ? A.AMBER : A.INK;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: `${ROW_METRICS.padY}px 0`,
        border: 'none',
        marginTop: gapAbove ? ROW_METRICS.padY * 2 : 0,
        background: 'transparent',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      <span
        className="tabular-nums"
        style={{ width: ROW_METRICS.posTrack, flexShrink: 0, textAlign: 'center', fontSize: ROW_METRICS.posSize, fontWeight: ROW_METRICS.posWeight, color: self ? A.AMBER : A.MUTE }}
      >
        {tie ? `T${pos}` : pos}
      </span>
      <span style={{ flexShrink: 0 }}>
        <MemberAvatar userId={id} name={avatarName} photoUrl={photo} size={ROW_METRICS.avatar} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: ROW_METRICS.nameSize,
            fontWeight: ROW_METRICS.nameWeight,
            lineHeight: ROW_METRICS.nameLine,
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
              marginTop: 1,
              fontSize: ROW_METRICS.subSize,
              fontWeight: 600,
              lineHeight: ROW_METRICS.subLine,
              color: A.DIM,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {secondary}
          </span>
        ) : null}
      </span>
      <span style={{ flexShrink: 0, textAlign: 'right' }}>
        <span className="tabular-nums" style={{ display: 'block', fontSize: ROW_VALUE_SIZE, fontWeight: ROW_METRICS.figureWeight, letterSpacing: '-0.04em', color: self ? ink : valueTone ?? ink }}>
          {value}
        </span>
        {caption ? (
          <span className="tabular-nums" style={{ display: 'block', fontSize: ROW_METRICS.secondarySize, fontWeight: ROW_METRICS.secondaryWeight, color: !self && captionTone ? captionTone : A.DIM }}>
            {caption}
          </span>
        ) : null}
      </span>
    </button>
  );
}

const TILE_HEAD = { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' } as const;

function Rail({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative', marginInline: -GUTTER }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingInline: GUTTER,
          scrollbarWidth: 'none',
          willChange: 'transform',
        }}
      >
        {children}
        <span style={{ flex: '0 0 14px' }} aria-hidden />
      </div>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 30,
          pointerEvents: 'none',
          background: `linear-gradient(to right, transparent, ${A.CANVAS})`,
        }}
      />
    </div>
  );
}

const FEAT_TONE: Record<FeatKind, string> = { ace: MEDAL_GOLD, albatross: MEDAL_SILVER, eagle: MEDAL_BRONZE, clean_card: REC.GOOD };

const RAIL_CARD = {
  flexShrink: 0,
  padding: 12,
  borderRadius: 14,
  border: `1px solid ${A.BORDER}`,
  background: A.PANEL,
  textAlign: 'left' as const,
  fontFamily: SANS,
  cursor: 'pointer',
};

/* ---------------------------------------------------------------- page */

export function ScoresLeaderboardsPage({
  userId,
  state,
  onOpenFilters,
  onRowPress,
  onMemberTap,
  onOpenCourse,
}: {
  userId: string | undefined;
  state: AmateurBoardState;
  onOpenFilters: () => void;
  onRowPress: (row: BoardRow) => void;
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

  const [featWindow, setFeatWindow] = useState<FeatWindow>('year');
  const featsYear = useFeatsWindow(userId, featWindow);
  /** Feat tiles are counted in the section's own window, so their sheets open on the same one. */
  const featFilters: BoardFilters = { ...DEFAULT_FILTERS, window: featWindow };
  const pickFeatWindow = (next: FeatWindow) => {
    if (next === featWindow) return;
    setFeatWindow(next);
    analyticsEvents.track('feats_window_changed', { window: next });
  };

  const birdiesC = useCareerBoard(userId, 'birdies', CAREER_RAIL_LIMIT, 'get_year_leaderboard');
  const roundsC = useCareerBoard(userId, 'rounds', CAREER_RAIL_LIMIT, 'get_year_leaderboard');
  const sub80C = useCareerBoard(userId, 'sub_80', CAREER_RAIL_LIMIT, 'get_year_leaderboard');
  const eaglesC = useCareerBoard(userId, 'eagles', CAREER_RAIL_LIMIT, 'get_year_leaderboard');
  const stablefordC = useCareerBoard(userId, 'best_stableford', CAREER_RAIL_LIMIT, 'get_year_leaderboard');
  const scoreDiffC = useCareerBoard(userId, 'best_score_diff', CAREER_RAIL_LIMIT, 'get_year_leaderboard');
  /* The tile reads rows 0-1; the sheet it opens reads the same query object. */
  const [leaderSheet, setLeaderSheet] = useState<CareerMetric | null>(null);
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
  const [careerSheet, setCareerSheet] = useState(false);

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
  /* The lead board's destination row follows the board's UNIT: rounds on
     Most recent (and any feat board), members on a ranked board. */
  const seeAllForBoard = (b: BoardKey) =>
    boardCountsRounds(b) ? t('amateur.leaderboards.seeAllRounds') : seeAllMembers();
  const boardCountText = (b: BoardKey, n: number) =>
    boardCountsRounds(b)
      ? t('amateur.leaderboards.nRounds', { count: n })
      : membersText(n);

  /* §4 row. start_index and current_index are FACTS from the RPC, so they are
     formatted directly — handicapJourneyDisplay derives an after-value from a
     round's delta and must not be used to re-derive numbers we already have. */
  const improvedRow = (r: ImprovementRow, inSheet: boolean) => {
    const pair = handicapPairDisplay({
      handicapIndex: r.current_index,
      deltaIndex: r.improvement == null ? null : -Number(r.improvement),
    });
    const month = r.started_on
      ? playDateAtLocalNoon(r.started_on)?.toLocaleDateString(undefined, { month: 'long' }) ?? null
      : null;
    const journey =
      r.start_index != null && r.current_index != null
        ? `${fmtHcp(Number(r.start_index))} \u2192 ${fmtHcp(Number(r.current_index))}${month ? ` ${t('amateur.leaderboards.since', { month })}` : ''}`
        : null;
    return (
      <CompactRow
        key={r.user_id}
        pos={r.pos}
        tie={r.is_tie}
        id={r.user_id}
        name={nameOf(r.display_name)}
        avatarName={r.display_name}
        photo={r.photo_url}
        secondary={journey}
        value={pair?.delta ? `${pair.delta.arrow}${pair.delta.text}` : '\u2014'}
        valueTone={pair?.delta?.tone}
        self={!!r.is_viewer || r.user_id === userId}
        onPress={() => {
          if (inSheet) setImprovedSheet(false);
          onMemberTap(r.user_id);
        }}
      />
    );
  };

  /* ------------------------------------------------------------ §3 lead */
  const leadRows = state.page.data?.rows ?? [];
  const leadVisible = leadRows.filter((r) => r.pos <= LEAD_POSITIONS);
  const leader = leadVisible[0] ?? null;
  const leadMine = userId ? leadRows.find((r) => r.user_id === userId) ?? null : null;
  const leadPinned = !!leadMine && !leadVisible.some((r) => r.user_id === leadMine.user_id);

  /* leaderFigures IS GONE. It mapped 'topar' onto the gross cells, so this
     page led with strokes where the see-all sheet led with to-par — two maps
     for one board. get_board_page records the same fault in SQL: floors once
     duplicated inline drifted, "so the facet counts and the rendered board
     answered different questions". boardValue()/boardSecondary(), read inside
     BoardRowView, are now the only figure map on this screen, podium included. */

  const boardTitle = t(BOARD_LABELS[state.board].i18n);

  /* ------------------------------------------------------------ §5 feats */
  /* §5 reads get_feats_window: true event counts (eagles, not rounds with an
     eagle) and the denominator each divides by, from one RPC row per kind. */
  const featRows = featsYear.data ?? [];
  const featsShown = featsYear.isSuccess
    ? featRows.filter((f) => f.events > 0).map((f) => ({ ...f, key: f.feat_kind as FeatBoardKey, tone: FEAT_TONE[f.feat_kind] }))
    : [];
  const featTotals = featsYear.isSuccess ? featRows[0] ?? null : null;
  // First load only: isFetched drops on key change while placeholderData holds rows; isSuccess does not.
  const featsFirstLoad = !featsYear.isSuccess && featRows.length === 0;
  const featLabel = (k: FeatBoardKey, n: number) => {
    switch (k) {
      case 'ace':
        return t('amateur.leaderboards.feat.ace', { count: n });
      case 'albatross':
        return t('amateur.leaderboards.feat.albatross', { count: n });
      case 'eagle':
        return t('amateur.leaderboards.feat.eagle', { count: n });
      default:
        return t('amateur.leaderboards.feat.cleanCard', { count: n });
    }
  };

  /* ------------------------------------------------------------ §6 career */
  const career = [
    { metric: 'birdies', label: t('amateur.leaderboards.career.birdies'), q: birdiesC },
    { metric: 'rounds', label: t('amateur.leaderboards.career.rounds'), q: roundsC },
    { metric: 'sub_80', label: t('amateur.leaderboards.career.sub80'), q: sub80C },
    { metric: 'eagles', label: t('amateur.leaderboards.career.eagles'), q: eaglesC, noAvg: true },
    { metric: 'best_stableford', label: t('amateur.leaderboards.career.bestStableford'), q: stablefordC },
    { metric: 'best_score_diff', label: t('amateur.leaderboards.career.bestScoreDiff'), q: scoreDiffC },
  ] as { metric: CareerMetric; label: string; q: typeof birdiesC; noAvg?: boolean }[];
  /* NOTHING ELSE JOINS THIS RAIL: holes in one / albatrosses are §5, lowest gross §3, bogey-free §5. */
  const careerSettled = career.every((c) => c.q.isFetched);
  const careerShown = career.filter((c) => c.q.isSuccess && (c.q.data?.length ?? 0) > 0);

  /* ------------------------------------------------- §7 short board */
  const shortBoard = (
    rows: CareerRow[],
    secondary: (r: CareerRow) => string | null,
    caption: string,
    onPress: (r: CareerRow) => void = (r) => onMemberTap(r.user_id),
    opts: { all?: boolean; fmt?: (r: CareerRow) => string } = {},
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
        self={!!r.is_viewer || r.user_id === userId}
        /* Three facts, three devices, no overlap: the wash states rank and belongs
           to 1st place whoever holds it; amber states identity and belongs to the
           viewing member; this 12px gap states the sequence broke above this row.
           A tint here would be a second identity device. */
        gapAbove={!!pin && r.user_id === pin.user_id && i === list.length - 1}
        onPress={() => onPress(r)}
      />
    ));
  };

  const top100Rows = top100.data ?? [];
  /* last_course_name is scoped in SQL to the selected list, so it changes with
     the chip alongside the count. Never fall back to home_club. */
  const top100Secondary = (r: CareerRow): string | null =>
    r.last_course_name ? t('amateur.leaderboards.latestCourse', { course: r.last_course_name }) : null;
  /* Same call as the progress sheet (same query key) — the sheet opens from cache. */
  const listCourses = useTop100ListProgress(userId ? top100List : undefined, userId, userId);
  const listTiles = useMemo(
    () => [...(listCourses.data ?? [])].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)),
    [listCourses.data],
  );
  const [top100Sheet, setTop100Sheet] = useState<CareerRow | null>(null);
  const openTop100Sheet = (r: CareerRow) => setTop100Sheet(r);

  const leadLoading = !state.ready || state.page.isPending;
  const pending = (h: number) => <div aria-hidden style={{ height: h, marginInline: GUTTER, marginBottom: 24 }} />;


  return (
    <div style={{ fontFamily: SANS }}>
      {/* 1.1 THE BOARD RAIL — the six offered ranking boards, each with its
          get_board_facets `board`-axis count under the current filters. Feat
          boards stay in §5. A zero renders greyed and unselectable; an
          unresolved count (null) renders no figure and greys nothing. */}
      <div
        role="radiogroup"
        aria-label={t('amateur.board.rail')}
        data-scores-board-rail
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 7,
          overflowX: 'auto',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x pan-y',
          willChange: 'transform',
          padding: `2px ${HEAD_GUTTER}px 12px`,
        }}
      >
        {OFFERED_RANKING_BOARD_KEYS.map((key) => {
          /* ONE GUARD, here where the rail reads: an absent counter is treated
             exactly like an unarrived count (null) — names, no figures, nothing
             greyed, because grey claims we counted and found zero. */
          const n = state.facets?.countFor?.('board', key) ?? null;
          const selected = state.board === key;
          const empty = n === 0 && !selected;
          /* 8.5 — figure and trailing word split so the word sits at 10.5/600 MUTE. */
          const valueText = n == null ? null : boardCountText(key, n);
          const m = valueText ? /^([^\s]+)\s+(.*)$/.exec(valueText) : null;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={empty || undefined}
              disabled={empty}
              data-board-chip={key}
              onClick={() => {
                if (empty || selected) return;
                state.changeBoard(key);
              }}
              style={{
                flex: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 3,
                minWidth: 92,
                padding: '8px 11px 9px',
                borderRadius: 11,
                background: selected ? CHIP_ACTIVE_BG : CHIP_BG,
                border: `1px solid ${selected ? CHIP_ACTIVE_BORDER : A.BORDER}`,
                opacity: empty ? 0.5 : 1,
                cursor: empty ? 'default' : 'pointer',
                fontFamily: SANS,
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              <span
                data-chip-label
                style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: selected ? A.AMBER : A.DIM }}
              >
                {t(BOARD_LABELS[key].i18n)}
              </span>
              <span
                data-chip-value
                className="tabular-nums"
                style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, minHeight: 19, lineHeight: '19px' }}
              >
                {valueText == null ? '\u00a0' : m ? (
                  <>
                    {m[1]}
                    <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0, color: A.MUTE, marginLeft: 4 }}>{m[2]}</span>
                  </>
                ) : valueText}
              </span>
            </button>
          );
        })}
      </div>
      {/* §3 THE LEAD BOARD (Phase 8) — no visible eyebrow or title: the active
          chip names the board and the basis sentence names the window. The
          section keeps its labelled landmark through a visually-hidden h2. */}
      {leadLoading || (state.page.isSuccess && leader) ? (
        <section aria-labelledby="scores-lead-board-title" style={{ fontFamily: SANS, marginBottom: 24 }}>
          <h2 id="scores-lead-board-title" data-scores-board-title style={VISUALLY_HIDDEN}>
            {boardTitle}
          </h2>
          {/* 8.2 ONE CONTROL ROW: scope takes the remaining width, Filters at its
              natural width. Outside the pending branch so the head never moves. */}
          <div data-scores-control-row style={{ display: 'flex', alignItems: 'center', gap: 9, padding: `0 ${HEAD_GUTTER}px 12px` }}>
            <ScopeSegments scope={scope} clubApplies={state.clubApplies} onScopeChange={state.changeScope} style={{ flex: 1, minWidth: 0 }} />
            <FiltersPill count={state.sheetFilterCount} onOpen={onOpenFilters} />
          </div>
          {/* 8.3 THE BASIS SENTENCE — rounds form or ranked form by boardCountsRounds. */}
          {(() => {
            const windowKey = state.filters.window;
            const scopeKey = state.filters.scope;
            const windowPhrase = t(`amateur.leaderboards.basisSentence.window.${windowKey}`);
            const strong = (text: string) => (
              <span style={{ color: A.MUTE, fontWeight: 600 }}>{text}</span>
            );
            const text = boardCountsRounds(state.board)
              ? t('amateur.leaderboards.basisSentence.rounds', {
                  scope: t(`amateur.leaderboards.basisSentence.scope.${scopeKey}`),
                  window: MARK_W,
                })
              : t('amateur.leaderboards.basisSentence.ranked', {
                  unit: MARK_U,
                  window: MARK_W,
                  scopeLead: t(`amateur.leaderboards.basisSentence.scopeLead.${scopeKey}`),
                });
            const unit = t(`amateur.leaderboards.basisSentence.unit.${state.board}`);
            return (
              <p data-scores-basis style={{ margin: 0, padding: `0 ${HEAD_GUTTER}px 11px`, fontSize: 11.5, lineHeight: 1.45, color: A.DIM }}>
                {splitMarks(text, { [MARK_W]: strong(windowPhrase), [MARK_U]: strong(unit) })}
              </p>
            );
          })()}
          {/* 8.4 THE YOU SLAB — always present for a signed-in member; three
              states from fields already on the page, plus an empty shape while
              the facets' `you` count is unresolved so the head does not move.
              SAFE ON EVERY OFFERED SCOPE: every offered scope includes the
              viewer, so a qualifying round means a place on the board. */}
          {userId ? (() => {
            const you = state.facets?.countFor?.('scope', 'you') ?? null;
            let kind: 'on' | 'deeper' | 'none' | 'pending';
            let figure: string | null = null;
            let sentence: ReactNode = null;
            if (leadMine) {
              kind = 'on';
              if (boardColumns(state.board).ranked) {
                figure = String(leadMine.pos);
              } else {
                figure = leadMine.gross_score != null && leadMine.course_par != null
                  ? fmtToPar(leadMine.gross_score - leadMine.course_par)
                  : '\u2014';
              }
              const d = playDateAtLocalNoon(leadMine.play_date);
              const date = d ? d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) : '';
              const youWord = <span style={{ color: A.INK, fontWeight: 700 }}>{t('amateur.leaderboards.slab.you')}</span>;
              const raw = leadMine.course_name
                ? t('amateur.leaderboards.slab.onBoard', { you: MARK_Y, course: leadMine.course_name, date })
                : t('amateur.leaderboards.slab.onBoardNoCourse', { you: MARK_Y, date });
              sentence = splitMarks(raw, { [MARK_Y]: youWord });
            } else if (you == null) {
              kind = 'pending';
            } else if (you > 0) {
              kind = 'deeper';
              figure = '\u2014';
              sentence = t('amateur.leaderboards.standing.deeper');
            } else {
              kind = 'none';
              figure = '\u2014';
              sentence = t(BOARD_FLOOR_COPY[state.board].i18n);
            }
            return (
              <div
                data-scores-standing={kind}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: `0 ${HEAD_GUTTER}px 12px`,
                  minHeight: 44,
                  padding: '11px 12px 11px 14.5px',
                  borderRadius: 11,
                  overflow: 'hidden',
                  background: SLAB_BG,
                }}
              >
                <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, background: A.AMBER }} />
                {figure != null ? (
                  <span className="tabular-nums" style={{ flex: 'none', fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK }}>
                    {figure}
                  </span>
                ) : null}
                {sentence != null ? (
                  <span style={{ minWidth: 0, fontSize: 12, lineHeight: 1.4, color: A.MUTE }}>{sentence}</span>
                ) : null}
              </div>
            );
          })() : null}
          <div style={{ paddingInline: GUTTER }}>
          {leadLoading || !leader ? (
            /* Rows area only — the head above is already final. */
            <div aria-hidden style={{ height: 500 }} />
          ) : (
            <>
          <div>
            <BoardHeaderRow board={state.board} />
            {(() => {
              const list = leadPinned && leadMine ? [...leadVisible, leadMine] : leadVisible;
              /* The podium is gated on rank: on 'recent' and the feat boards
                 (date orders) the first row is an ordinary row. */
              const ranked = boardColumns(state.board).ranked;
              return list.map((r, i) => (
                <BoardRowView
                  key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
                  row={r}
                  board={state.board}
                  isSelf={r.user_id === userId}
                  podium={ranked && i === 0 && r.pos === 1}
                  onPress={onRowPress}
                />
              ));
            })()}
          </div>
          {state.total > leadVisible.length || (userId && !leadMine && (state.facets?.countFor?.('scope', 'you') ?? 0) > 0) ? (
            <SeeAll
              label={seeAllForBoard(state.board)}
              onPress={() => {
                analyticsEvents.track('amateur_board_see_all_opened', { board: state.board, total: state.total });
                setSeeAll({ board: state.board, filters: state.filters });
              }}
            />
          ) : null}
            </>
          )}
          </div>
        </section>
      ) : null}

      {/* §5 FEATS THIS YEAR — event counts; footnote is distinct members. */}
      {featsFirstLoad ? (
        pending(175)
      ) : featsShown.length > 0 ? (
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
                display: 'flex', gap: 3, padding: 3, borderRadius: 999, flex: 'none', alignSelf: 'center',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
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
                      height: 24, padding: '0 10px', borderRadius: 999, border: 'none',
                      fontFamily: SANS, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
                      letterSpacing: 'normal', textTransform: 'none',
                      background: selected ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: selected ? A.INK : A.MUTE,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          lede={featTotals && featTotals.total_rounds > 0 ? (
            <Trans
              i18nKey="amateur.leaderboards.featsFrom"
              defaults="From <n>{{rounds}} full rounds</n> and <n>{{holes}} holes</n> tracked on clbhouz."
              values={{ rounds: featTotals.total_rounds.toLocaleString(), holes: featTotals.total_holes.toLocaleString() }}
              components={{ n: <span style={{ fontWeight: 700, color: A.INK }} /> }}
            />
          ) : undefined}
        >
          <Rail>
            {featsShown.map((f) => (
              <button key={f.key} type="button" onClick={() => setSeeAll({ board: f.key, filters: featFilters })} style={{ ...RAIL_CARD, width: 150, position: 'relative' }}>
                <span aria-hidden style={{ position: 'absolute', top: 12, right: 11, color: FAINT, display: 'flex' }}>
                  <ChevronRight size={13} />
                </span>
                <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: f.tone, color: A.CANVAS }}>
                  <Medal size={15} />
                </span>
                <span className="tabular-nums" style={{ display: 'block', marginTop: 10, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>
                  {f.events}
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.MUTE }}>
                  {featLabel(f.key, f.events)}
                </span>
                <span className="tabular-nums" style={{ display: 'block', marginTop: 6, fontSize: 10.5, lineHeight: 1.3, color: A.MUTE }}>
                  {t('amateur.leaderboards.featRarity', {
                    n: Math.round(f.denominator / f.events).toLocaleString(),
                    unit: t(`amateur.leaderboards.unit.${f.denominator_unit}`),
                  })}
                </span>
                <span style={{ display: 'block', marginTop: 6, fontSize: 10.5, color: A.DIM }}>{membersText(f.members)}</span>
              </button>
            ))}
          </Rail>
        </Section>
      ) : null}

      {/* §7 TOP 100 — get_career_leaderboard(TOP100_METRIC[list]). This section
          is get_career_leaderboard's ONLY consumer; its other branches
          (including 'crowns') stay in SQL, dormant.
          NO THIN FLOOR ON A LIST THE MEMBER CHOSE: once a chip is tapped, any
          row count is shown and zero rows reads one quiet line. Only the
          DEFAULT list being empty (or failing) on load hides the section. */}
      {top100Defaulted && top100.isPending ? (
        /* No pinned row: the skeleton cannot know if the viewer is in the top 3,
           and the shorter shape grows downward (expand-outwards-only). */
        pending(150)
      ) : top100Defaulted && !(top100.isSuccess && top100Rows.length > 0) ? null : (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.theHundred')}
          title={t('amateur.leaderboards.top100')}
        >
          {/* §7 head is eyebrow + title only — meta (member count) and lede
              (field average) were dropped; See all is the only count surface. */}
          <div style={{ marginBottom: 12 }}>
            <RailChips
              align="center-when-fit"

              ground="filled-selection"
              options={TOP100_ORDER.map((slug) => ({ id: slug, label: RANK_SCOPE_LABEL[slug] }))}
              value={top100List}
              onChange={pickTop100}
              ariaLabel={t('amateur.leaderboards.top100List')}
            />
          </div>
          {/* A chip tap starts a fresh slug query. While it loads, reserve the
              strip (caption + 76px tile row) instead of holding the old list:
              last list's photographs under the new list's caption is worse than
              a brief empty rail. Deliberately NOT placeholderData. */}
          {userId && listCourses.isPending ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginTop: 16 }}>
                <span style={{ ...TILE_HEAD, color: A.DIM }}>
                  {t('amateur.leaderboards.theListHundred', { list: RANK_SCOPE_LABEL[top100List] })}
                </span>
              </div>
              <div aria-hidden style={{ height: 76 }} />
            </div>
          ) : listCourses.isSuccess && listTiles.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginTop: 16 }}>
                <span style={{ ...TILE_HEAD, color: A.DIM }}>
                  {t('amateur.leaderboards.theListHundred', { list: RANK_SCOPE_LABEL[top100List] })}
                </span>
              </div>
              <Rail>
                {listTiles.map((c) => (
                  <button
                    key={c.course_id}
                    type="button"
                    onClick={() => onOpenCourse(c.course_id)}
                    aria-label={c.course_name}
                    style={{
                      width: 108, height: 76, borderRadius: 10, overflow: 'hidden', position: 'relative',
                      flexShrink: 0, padding: 0, background: A.PANEL,
                      border: c.thumbnail_image ? 'none' : `1px solid ${A.BORDER}`,
                    }}
                  >
                    {c.thumbnail_image ? (
                      <img src={c.thumbnail_image} alt="" loading="lazy" decoding="async"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : null}
                    <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.76))' }} />
                    {c.rank != null ? (
                      <span className="tabular-nums" style={{ position: 'absolute', left: 6, top: 5, fontSize: 9, fontWeight: 700, color: '#FFF', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                        {`#${c.rank}`}
                      </span>
                    ) : null}
                    <span style={{
                      position: 'absolute', left: 6, right: 6, bottom: 5, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.15, color: '#FFF',
                      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                      display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                      textAlign: 'left',
                    }}>
                      {c.course_name}
                    </span>
                  </button>
                ))}
              </Rail>
            </div>
          ) : null}
          {top100.isPending ? (
            <div style={{ minHeight: 120 }} />
          ) : top100Rows.length === 0 ? (
            <p style={{ margin: 0, padding: '12px 0', fontFamily: SANS, fontSize: 13, color: A.MUTE }}>
              {t('amateur.leaderboards.top100Empty')}
            </p>
          ) : (
            shortBoard(top100Rows, top100Secondary, t('amateur.leaderboards.of100'), openTop100Sheet)
          )}
          {top100Rows.length > SHORT_ROWS ? (
            <SeeAll label={seeAllMembers()} onPress={() => setCareerSheet(true)} />
          ) : null}
        </Section>
      )}

      {/* §6 WHO LEADS WHAT — this calendar year's leader of each metric, read
          from get_year_leaderboard (CAREER_RAIL_LIMIT: the tile reads rows 0-1, the sheet the field).
          JANUARY IS THIN BY DESIGN: on 1 January every value is zero, the RPC
          filters value > 0, and this section renders nothing. That is a fresh
          race, not a bug — never add a "last year's final" fallback or carry
          figures over. */}
      {!careerSettled ? (
        pending(150)
      ) : careerShown.length > 0 ? (
        <Section
          contest
          eyebrow={String(new Date().getFullYear())}
          title={t('amateur.leaderboards.whoLeads')}
        >
          <Rail>
            {careerShown.map((c) => {
              const r = c.q.data![0];
              const second = c.q.data![1];
              /* Decided from the VALUES, not is_tie (which marks a tie anywhere). */
              const margin = second ? fmtCareerMargin(c.metric, r.value, second.value) : null;
              return (
                <button key={c.metric} type="button" onClick={() => setLeaderSheet(c.metric)} style={{ ...RAIL_CARD, width: 150 }}>
                  <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.AMBER }}>
                    {c.label}
                  </span>
                  <span style={{ display: 'block', marginTop: 8, fontSize: 12.5, fontWeight: 700, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {nameOf(r.display_name)}
                  </span>
                  {/* NAME AND CLUB TAKE THE CARD'S FULL WIDTH. The avatar moved
                      beside the value, which was empty space, so these two lines
                      no longer share the row with it.
                      THE CLUB MAY STILL TRUNCATE: "Hanbury Manor Golf & Country
                      Club" measures 160.6px against roughly 122px. That is
                      accepted, not solved — render the full home_club and let it
                      ellipse; never shorten club names.
                      CHROMIUM MEASUREMENTS UNDERSTATE DEVICE WIDTHS: "Andrew
                      Yetzes" measured 66px yet truncated at 94px on an iPhone.
                      Treat these figures as a floor, not a budget — a label that
                      only just fits in a measurement does not fit. That is why
                      this layout took a 34% width increase over a calculated one. */}
                  {r.home_club ? (
                    <span style={{ display: 'block', marginTop: 2, fontSize: 10, fontWeight: 500, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.home_club}
                    </span>
                  ) : null}
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span className="tabular-nums" style={{ display: 'block', fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>
                      {fmtCareerValue(c.metric, r.value)}
                    </span>
                    <span style={{ flexShrink: 0, display: 'flex' }}>
                      <MemberAvatar userId={r.user_id} name={r.display_name} photoUrl={r.photo_url} size={30} />
                    </span>
                  </span>
                  {margin != null ? (
                    <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, color: A.DIM }}>
                      {margin.zero
                        ? t('amateur.leaderboards.tiedTop')
                        : t('amateur.leaderboards.clearOf2nd', { n: margin.text })}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </Rail>
        </Section>
      ) : null}

      {/* §4 MOST IMPROVED — cumulative this year, not a single round's cut. */}
      {improved.isPending ? (
        pending(180)
      ) : improved.isSuccess && improvedRows.length >= THIN_FLOOR ? (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.climb')}
          title={t('amateur.leaderboards.mostImproved')}
          meta={windowLabel('year')}
        >
          {improvedRows.slice(0, SHORT_ROWS).map((r) => improvedRow(r, false))}
          <SeeAll
            label={seeAllMembers()}
            onPress={() => setImprovedSheet(true)}
          />
        </Section>
      ) : null}

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
        valueHeading={t('amateur.leaderboards.indexChange')}
        footnote={t('amateur.leaderboards.improvedQualifier')}
      >
        {improvedRows.map((r) => improvedRow(r, true))}
      </BoardSheet>

      {(() => {
        const c = leaderSheet ? career.find((x) => x.metric === leaderSheet) : undefined;
        const rows = c?.q.data ?? [];
        const scope = t('amateur.leaderboards.improvedScope');
        return (
          <BoardSheet
            open={!!c}
            onClose={() => setLeaderSheet(null)}
            titleId="leader-see-all-title"
            title={c?.label ?? ''}
            subtitle={rows.length > 0 ? `${scope} · ${membersText(Number(rows[0].total_members))}` : scope}
            valueHeading={c?.label ?? ''}
          >
            {c ? shortBoard(rows, () => null, '', (r) => onMemberTap(r.user_id), { all: true, fmt: (r) => fmtCareerValue(c.metric, r.value) }) : null}
          </BoardSheet>
        );
      })()}

      <BoardSheet
        open={careerSheet}
        onClose={() => setCareerSheet(false)}
        titleId="career-see-all-title"
        title={t('amateur.leaderboards.top100')}
        subtitle={top100Rows.length > 0
          ? `${RANK_SCOPE_LABEL[top100List]} · ${membersText(Number(top100Rows[0].total_members))}`
          : RANK_SCOPE_LABEL[top100List]}
        valueHeading={t('amateur.leaderboards.coursesOf100')}
        above={
        <div style={{ padding: '11px 16px', /* Hairline clause: controls from list. */ borderBottom: `1px solid ${A.BORDER}`, flexShrink: 0 }}>
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
              self={!!r.is_viewer || r.user_id === userId}
              onPress={() => {
                setCareerSheet(false);
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
}
