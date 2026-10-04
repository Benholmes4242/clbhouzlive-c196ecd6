import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Medal } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { boardSecondary, boardValue, fmtToPar } from '@/components/explore-tab-new/courseled/BoardRows';
import { describeFilterParts } from '@/components/explore-tab-new/courseled/GolfThisWeek';
import { useBoardPage, type BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import {
  BOARD_LABELS,
  DEFAULT_FILTERS,
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
import { useViewerStanding } from './useViewerStanding';
import { handicapJourneyDisplay, handicapPairDisplay } from './circleHandicap';

/**
 * THE LEADERBOARDS PAGE (BRIEF — THE LEADERBOARDS PAGE, structure A).
 *
 * EVERY SECTION ANSWERS A DIFFERENT QUESTION. Scope governs the two lead boards
 * (§3 Lowest gross, §4 Biggest cuts) and nothing below them: career, course
 * records and Top 100 are platform facts. Each section owns its read, holds its
 * own height while pending, and renders NOTHING when its read fails or is empty.
 */

const GUTTER = 16;
const LEAD_POSITIONS = 10;
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
  field_avg: number | null;
  courses: number | null;
  total_members: number;
  is_viewer: boolean | null;
}

type CareerMetric = 'crowns' | 'top_100_gbni_distinct' | 'birdies' | 'rounds' | 'sub_80' | 'eagles';

function useCareerBoard(viewerId: string | undefined, metric: CareerMetric, limit: number) {
  return useQuery<CareerRow[]>({
    queryKey: ['leaderboards', 'career', viewerId ?? 'anon', metric, limit],
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      /* Bound to the client: supabase.rpc reads `this.rest`. */
      const { data, error } = await (supabase.rpc as unknown as (
        f: string,
        a: Record<string, unknown>,
      ) => Promise<{ data: CareerRow[] | null; error: unknown }>).call(supabase, 'get_career_leaderboard', {
        p_viewer: viewerId ?? null,
        p_metric: metric,
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const YEAR_FILTERS: BoardFilters = { ...DEFAULT_FILTERS, window: 'year' };
const ALL_TIME_FILTERS: BoardFilters = { ...DEFAULT_FILTERS, window: 'all' };

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
  first,
  children,
}: {
  eyebrow: string;
  contest: boolean;
  title: ReactNode;
  meta?: ReactNode;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        fontFamily: SANS,
        paddingInline: GUTTER,
        marginTop: first ? 24 : 0,
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
          <div className="tabular-nums" style={{ ...EYEBROW, color: A.DIM, flexShrink: 0, whiteSpace: 'nowrap' }}>
            {meta}
          </div>
        ) : null}
      </div>
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

function Avatar({ id, name, src, size }: { id: string; name: string; src: string | null; size: number }) {
  return (
    <SquircleAvatar
      src={src}
      alt={name}
      userId={id}
      fallback={getInitialsFromName(name).slice(0, 2)}
      size={size}
      hairlineRing
    />
  );
}

function CompactRow({
  pos,
  tie,
  id,
  name,
  photo,
  secondary,
  value,
  caption,
  valueTone,
  self,
  divider,
  onPress,
}: {
  pos: number;
  tie: boolean;
  id: string;
  name: string;
  photo: string | null;
  secondary: string | null;
  value: string;
  caption?: string | null;
  valueTone?: string;
  self: boolean;
  divider: boolean;
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
        padding: '8px 0',
        border: 'none',
        borderBottom: divider ? `1px solid ${A.SOFT}` : 'none',
        background: 'transparent',
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
      }}
    >
      <span
        className="tabular-nums"
        style={{ width: 20, flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: self ? A.AMBER : FAINT }}
      >
        {tie ? `T${pos}` : pos}
      </span>
      <span style={{ flexShrink: 0 }}>
        <Avatar id={id} name={name} src={photo} size={26} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
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
              fontSize: 10.5,
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
        <span className="tabular-nums" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: self ? ink : valueTone ?? ink }}>
          {value}
        </span>
        {caption ? (
          <span className="tabular-nums" style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: A.DIM }}>
            {caption}
          </span>
        ) : null}
      </span>
    </button>
  );
}

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
  onOpenBoard,
  onOpenFilters,
  onRowPress,
  onOpenProfile,
  onOpenCourse,
}: {
  userId: string | undefined;
  state: AmateurBoardState;
  onOpenBoard: () => void;
  onOpenFilters: () => void;
  onRowPress: (row: BoardRow) => void;
  onOpenProfile: (userId: string) => void;
  onOpenCourse: (courseId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const nameOf = (n: string | null | undefined) => n || t('discover.aMember', 'A member');
  const scope = state.filters.scope;

  /* PAGE HEAD figures: the all-time pool of every member's rounds. */
  const totals = useBoardPage(userId, 'recent', ALL_TIME_FILTERS, { limit: 1 });

  /* §4 — the improved board at the page's scope; sheet filters belong to §3. */
  const cutsFilters = useMemo(() => ({ ...entryFiltersFor(scope), window: 'year' as WindowKey }), [scope]);
  const cuts = useBoardPage(userId, 'improved', cutsFilters, { limit: 50, enabled: state.ready });

  const standing = useViewerStanding(userId);

  const ace = useBoardPage(userId, 'ace', YEAR_FILTERS, { limit: 200 });
  const albatross = useBoardPage(userId, 'albatross', YEAR_FILTERS, { limit: 200 });
  const eagle = useBoardPage(userId, 'eagle', YEAR_FILTERS, { limit: 200 });
  const clean = useBoardPage(userId, 'clean_card', YEAR_FILTERS, { limit: 200 });

  const birdiesC = useCareerBoard(userId, 'birdies', 1);
  const roundsC = useCareerBoard(userId, 'rounds', 1);
  const sub80C = useCareerBoard(userId, 'sub_80', 1);
  const eaglesC = useCareerBoard(userId, 'eagles', 1);
  const crowns = useCareerBoard(userId, 'crowns', 25);
  const top100 = useCareerBoard(userId, 'top_100_gbni_distinct', 25);

  const [seeAll, setSeeAll] = useState<{ board: BoardKey; filters: BoardFilters } | null>(null);
  const [careerSheet, setCareerSheet] = useState<'crowns' | 'top100' | null>(null);
  const [coursesSheet, setCoursesSheet] = useState(false);

  const windowLabel = (w: WindowKey) =>
    w === '14'
      ? t('amateur.leaderboards.window.d14', 'This fortnight')
      : w === '30'
        ? t('amateur.leaderboards.window.d30', 'This month')
        : w === '90'
          ? t('amateur.leaderboards.window.d90', 'Last 90 days')
          : w === 'year'
            ? t('amateur.leaderboards.window.year', 'This year')
            : t('amateur.leaderboards.window.all', 'All time');

  const membersText = (n: number) =>
    t('amateur.leaderboards.nMembers', { count: n, defaultValue_one: '{{count}} member', defaultValue_other: '{{count}} members' });
  const seeAllMembers = (n: number) =>
    t('amateur.leaderboards.seeAllMembers', { count: n, defaultValue_one: 'See all {{count}} member', defaultValue_other: 'See all {{count}} members' });

  /* ------------------------------------------------------------ §3 lead */
  const leadRows = state.page.data?.rows ?? [];
  const leadVisible = leadRows.filter((r) => r.pos <= LEAD_POSITIONS);
  const leader = leadVisible[0] ?? null;
  const leadMine = userId ? leadRows.find((r) => r.user_id === userId) ?? null : null;
  const leadPinned = !!leadMine && !leadVisible.some((r) => r.user_id === leadMine.user_id);

  /** The leader card's big figure and the line beneath it. */
  const leaderFigures = (r: BoardRow) => {
    const board = state.board;
    if (board === 'topar' || board === 'gross') {
      const p = r.gross_score != null && r.course_par != null ? r.gross_score - r.course_par : null;
      return { big: r.gross_score != null ? String(r.gross_score) : '\u2014', small: fmtToPar(p), tone: A.RED };
    }
    const v = boardValue(r, board, t as never);
    const s = boardSecondary(r, board);
    return { big: v.text, small: s?.text ?? null, tone: A.RED };
  };
  const leadCaption = (r: BoardRow) => {
    if (state.board === 'topar' || state.board === 'gross') {
      return fmtToPar(r.gross_score != null && r.course_par != null ? r.gross_score - r.course_par : null);
    }
    return boardSecondary(r, state.board)?.text ?? null;
  };
  const leadValue = (r: BoardRow) =>
    state.board === 'topar' || state.board === 'gross'
      ? r.gross_score != null ? String(r.gross_score) : '\u2014'
      : boardValue(r, state.board, t as never).text;

  const boardTitle = t(BOARD_LABELS[state.board].i18n, BOARD_LABELS[state.board].label);

  /* ------------------------------------------------------------ §6 feats */
  const feats = (
    [
      { key: 'ace' as FeatBoardKey, q: ace, tone: MEDAL_GOLD },
      { key: 'albatross' as FeatBoardKey, q: albatross, tone: MEDAL_SILVER },
      { key: 'eagle' as FeatBoardKey, q: eagle, tone: MEDAL_BRONZE },
      { key: 'clean_card' as FeatBoardKey, q: clean, tone: REC.GOOD },
    ]
  ).map((f) => {
    const rows = f.q.data?.rows ?? [];
    return {
      ...f,
      events: f.q.data?.total ?? 0,
      /* DISTINCT MEMBERS from the returned rows, never a pool_* field. */
      members: new Set(rows.map((r) => r.user_id)).size,
    };
  });
  const featsSettled = feats.every((f) => f.q.isFetched);
  const featsShown = feats.filter((f) => f.q.isSuccess && f.events > 0);
  const featLabel = (k: FeatBoardKey, n: number) => {
    switch (k) {
      case 'ace':
        return t('amateur.leaderboards.feat.ace', { count: n, defaultValue_one: 'Hole in one', defaultValue_other: 'Holes in one' });
      case 'albatross':
        return t('amateur.leaderboards.feat.albatross', { count: n, defaultValue_one: 'Albatross', defaultValue_other: 'Albatrosses' });
      case 'eagle':
        return t('amateur.leaderboards.feat.eagle', { count: n, defaultValue_one: 'Eagle', defaultValue_other: 'Eagles' });
      default:
        return t('amateur.leaderboards.feat.cleanCard', { count: n, defaultValue_one: 'Bogey-free round', defaultValue_other: 'Bogey-free rounds' });
    }
  };

  /* ------------------------------------------------------------ §7 career */
  const career = [
    { metric: 'birdies', label: t('amateur.leaderboards.career.birdies', 'Birdies'), q: birdiesC },
    { metric: 'rounds', label: t('amateur.leaderboards.career.rounds', 'Rounds'), q: roundsC },
    { metric: 'sub_80', label: t('amateur.leaderboards.career.sub80', 'Sub-80 rounds'), q: sub80C },
    { metric: 'eagles', label: t('amateur.leaderboards.career.eagles', 'Eagles'), q: eaglesC, noAvg: true },
  ];
  const careerSettled = career.every((c) => c.q.isFetched);
  const careerShown = career.filter((c) => c.q.isSuccess && (c.q.data?.length ?? 0) > 0);
  const careerMembers = careerShown.reduce((m, c) => Math.max(m, Number(c.q.data![0].total_members) || 0), 0);

  /* ------------------------------------------------- §8/§9 short boards */
  const shortBoard = (
    rows: CareerRow[],
    secondary: (r: CareerRow) => string | null,
    caption: string,
  ) => {
    const top = rows.slice(0, SHORT_ROWS);
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
        photo={r.photo_url}
        secondary={secondary(r)}
        value={String(r.value)}
        caption={caption}
        self={!!r.is_viewer || r.user_id === userId}
        divider={i < list.length - 1}
        onPress={() => onOpenProfile(r.user_id)}
      />
    ));
  };

  const crownsRows = crowns.data ?? [];
  const top100Rows = top100.data ?? [];
  const recordsCaption = t('amateur.leaderboards.records', 'records');
  const crownsSecondary = (r: CareerRow) =>
    r.courses != null
      ? t('amateur.leaderboards.acrossCourses', { count: r.courses, defaultValue_one: 'Across {{count}} course', defaultValue_other: 'Across {{count}} courses' })
      : null;
  /* get_career_leaderboard returns no most-recent course; the home club is the
     only place line it carries. */
  const top100Secondary = (_r: CareerRow): string | null => null;

  /** Rank, field and movement — one form for the rail card and the sheet row. */
  const standingFigures = (r: (typeof standing.rows)[number]) => {
    const d = r.delta;
    const up = d != null && d > 0;
    const down = d != null && d < 0;
    return (
      <>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }} className="tabular-nums">
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>{r.rank_now}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: A.DIM }}>{t('amateur.leaderboards.ofN', 'of {{n}}', { n: r.field_now })}</span>
        </span>
        <span className="tabular-nums" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 4, fontSize: 10.5, fontWeight: 700, color: up ? A.GREEN : down ? A.RED : A.DIM }}>
          {up ? <ArrowUp size={11} /> : down ? <ArrowDown size={11} /> : null}
          {up || down ? Math.abs(d!) : t('amateur.leaderboards.held', 'Held')}
        </span>
      </>
    );
  };

  const pending = (h: number) => <div aria-hidden style={{ height: h, marginInline: GUTTER, marginBottom: 24 }} />;

  const totalsRow = totals.data?.rows[0];

  return (
    <div style={{ fontFamily: SANS }}>
      {/* PAGE HEAD — no Filters button; filters belong to the board they filter. */}
      <div style={{ paddingInline: GUTTER }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>
          {t('amateur.leaderboards.title', 'Leaderboards')}
        </h1>
        <div className="tabular-nums" style={{ marginTop: 4, minHeight: 17, fontSize: 12.5, color: A.DIM }}>
          {totals.isSuccess && totalsRow
            ? `${membersText(Number(totalsRow.pool_members))} \u00B7 ${t('amateur.leaderboards.nRounds', {
                count: Number(totalsRow.pool_rounds),
                defaultValue_one: '{{count}} round',
                defaultValue_other: '{{count}} rounds',
              })}`
            : null}
        </div>
        <ScopeSegments
          scope={scope}
          clubApplies={state.clubApplies}
          onScopeChange={state.changeScope}
          style={{ marginTop: 12 }}
        />
        <div style={{ marginTop: 8, fontSize: 11, color: FAINT }}>
          {t('amateur.leaderboards.scopeNote', 'Applies to the two boards below. Career records are all members.')}
        </div>
      </div>

      {/* §3 THE LEAD BOARD */}
      {!state.ready || state.page.isPending ? (
        <div style={{ marginTop: 24 }}>{pending(560)}</div>
      ) : state.page.isSuccess && leader ? (
        <Section
          first
          contest
          eyebrow={windowLabel(state.filters.window)}
          title={
            <button
              type="button"
              data-scores-board-picker
              onClick={onOpenBoard}
              aria-label={t('amateur.board.openPicker', 'Choose a board')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                maxWidth: '100%',
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: A.INK,
                fontFamily: SANS,
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{boardTitle}</span>
              <ChevronDown size={16} color={A.MUTE} style={{ flexShrink: 0 }} />
            </button>
          }
          meta={
            <span style={{ letterSpacing: 0, textTransform: 'none' }}>
              <FiltersPill count={state.sheetFilterCount} onOpen={onOpenFilters} />
            </span>
          }
        >
          {(() => {
            const f = leaderFigures(leader);
            const self = leader.user_id === userId;
            return (
              <button
                type="button"
                onClick={() => onRowPress(leader)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 16,
                  border: `1px solid ${REC.AMBER_LINE}`,
                  background: REC.AMBER_WASH,
                  textAlign: 'left',
                  fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                <Avatar id={leader.user_id} name={nameOf(leader.display_name)} src={leader.profile_photo_url} size={46} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 16,
                      fontWeight: 700,
                      color: self ? A.AMBER : A.INK,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {nameOf(leader.display_name)}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      fontSize: 11.5,
                      color: A.MUTE,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {[leader.course_name, leader.play_date ? new Date(leader.play_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null]
                      .filter(Boolean)
                      .join(' \u00B7 ')}
                  </span>
                </span>
                <span style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span
                    className="tabular-nums"
                    style={{ display: 'block', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: self ? A.AMBER : A.INK, lineHeight: 1 }}
                  >
                    {f.big}
                  </span>
                  {f.small ? (
                    <span className="tabular-nums" style={{ display: 'block', marginTop: 4, fontSize: 12, fontWeight: 700, color: f.tone }}>
                      {f.small}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })()}
          <div style={{ marginTop: 6 }}>
            {(() => {
              const rest = leadVisible.slice(1);
              const list = leadPinned && leadMine ? [...rest, leadMine] : rest;
              return list.map((r, i) => (
                <CompactRow
                  key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
                  pos={r.pos}
                  tie={r.is_tie}
                  id={r.user_id}
                  name={nameOf(r.display_name)}
                  photo={r.profile_photo_url}
                  secondary={r.course_name}
                  value={leadValue(r)}
                  caption={leadCaption(r)}
                  self={r.user_id === userId}
                  divider={i < list.length - 1}
                  onPress={() => onRowPress(r)}
                />
              ));
            })()}
          </div>
          {state.total > leadVisible.length ? (
            <SeeAll
              label={seeAllMembers(Number(state.page.data?.pool.members ?? state.total))}
              onPress={() => {
                analyticsEvents.track('amateur_board_see_all_opened', { board: state.board, total: state.total });
                setSeeAll({ board: state.board, filters: state.filters });
              }}
            />
          ) : null}
        </Section>
      ) : null}

      {/* §4 BIGGEST CUTS */}
      {!state.ready || cuts.isPending ? (
        pending(200)
      ) : cuts.isSuccess && (cuts.data?.rows.length ?? 0) > 0 ? (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.climb', 'The climb')}
          title={t('amateur.leaderboards.biggestCuts', 'Biggest cuts')}
          meta={windowLabel(cutsFilters.window)}
        >
          {cuts.data!.rows.slice(0, SHORT_ROWS).map((r, i, arr) => {
            const pair = handicapPairDisplay({ handicapIndex: r.hcp_at_time, deltaIndex: r.delta_index });
            const journey = handicapJourneyDisplay({ handicapIndex: r.hcp_at_time, deltaIndex: r.delta_index });
            return (
              <CompactRow
                key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
                pos={r.pos}
                tie={r.is_tie}
                id={r.user_id}
                name={nameOf(r.display_name)}
                photo={r.profile_photo_url}
                secondary={journey ? `${journey.before} \u2192 ${journey.after}` : r.course_name}
                value={pair?.delta ? `${pair.delta.arrow}${pair.delta.text}` : '\u2014'}
                valueTone={pair?.delta?.tone}
                self={r.user_id === userId}
                divider={i < arr.length - 1}
                onPress={() => onRowPress(r)}
              />
            );
          })}
          <SeeAll
            label={seeAllMembers(cuts.data!.total)}
            onPress={() => setSeeAll({ board: 'improved', filters: cutsFilters })}
          />
        </Section>
      ) : null}

      {/* §5 YOUR COURSES — per-course rank, never labelled with a board name. */}
      {!standing.isFetched ? (
        userId ? pending(150) : null
      ) : !standing.unresolved && standing.rows.length > 0 ? (
        <Section
          contest={false}
          eyebrow={t('amateur.leaderboards.whereYouStand', 'Where you stand')}
          title={t('amateur.leaderboards.yourCourses', 'Your courses')}
          meta={t('amateur.leaderboards.sinceLastVisit', 'Since your last visit')}
        >
          <Rail>
            {standing.rows.map((r) => (
              <button key={r.course_id} type="button" onClick={() => onOpenCourse(r.course_id)} style={{ ...RAIL_CARD, width: 152 }}>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 31, fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: A.MUTE }}>
                  {r.course_name ?? t('discover.unknownCourse', 'A course')}
                </span>
                <span style={{ display: 'block', marginTop: 8 }}>{standingFigures(r)}</span>
              </button>
            ))}
          </Rail>
          <SeeAll
            label={t('amateur.leaderboards.allCourses', { count: standing.rows.length, defaultValue_one: 'All {{count}} course', defaultValue_other: 'All {{count}} courses' })}
            onPress={() => setCoursesSheet(true)}
          />
        </Section>
      ) : null}

      {/* §6 FEATS THIS YEAR — event counts; footnote is distinct members. */}
      {!featsSettled ? (
        pending(150)
      ) : featsShown.length > 0 ? (
        <Section
          contest={false}
          eyebrow={t('amateur.leaderboards.rareAir', 'Rare air')}
          title={t('amateur.leaderboards.featsThisYear', 'Feats this year')}
          meta={t('amateur.leaderboards.nKinds', { count: featsShown.length, defaultValue_one: '{{count}} kind', defaultValue_other: '{{count}} kinds' })}
        >
          <Rail>
            {featsShown.map((f) => (
              <button key={f.key} type="button" onClick={() => setSeeAll({ board: f.key, filters: YEAR_FILTERS })} style={{ ...RAIL_CARD, width: 112 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: f.tone, color: A.CANVAS }}>
                  <Medal size={15} />
                </span>
                <span className="tabular-nums" style={{ display: 'block', marginTop: 10, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>
                  {f.events}
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.MUTE }}>
                  {featLabel(f.key, f.events)}
                </span>
                <span style={{ display: 'block', marginTop: 6, fontSize: 10.5, color: A.DIM }}>{membersText(f.members)}</span>
              </button>
            ))}
          </Rail>
        </Section>
      ) : null}

      {/* §7 CAREER — the leader of each metric, never the viewer. */}
      {!careerSettled ? (
        pending(150)
      ) : careerShown.length > 0 ? (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.career', 'Career')}
          title={t('amateur.leaderboards.whoLeads', 'Who leads what')}
          meta={careerMembers > 0 ? membersText(careerMembers) : null}
        >
          <Rail>
            {careerShown.map((c) => {
              const r = c.q.data![0];
              return (
                <button key={c.metric} type="button" onClick={() => onOpenProfile(r.user_id)} style={{ ...RAIL_CARD, width: 150 }}>
                  <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.AMBER }}>
                    {c.label}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, minWidth: 0 }}>
                    <Avatar id={r.user_id} name={nameOf(r.display_name)} src={r.photo_url} size={24} />
                    <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 700, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {nameOf(r.display_name)}
                    </span>
                  </span>
                  <span className="tabular-nums" style={{ display: 'block', marginTop: 8, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>
                    {r.value}
                  </span>
                  <span style={{ display: 'block', marginTop: 2, fontSize: 10.5, color: A.DIM }}>{(() => {
                    const avg = Math.round(Number(r.field_avg) || 0);
                    return !('noAvg' in c) && avg > 0
                      ? t('amateur.leaderboards.average', 'Average {{n}}', { n: avg })
                      : membersText(Number(r.total_members));
                  })()}</span>
                </button>
              );
            })}
          </Rail>
        </Section>
      ) : null}

      {/* §8 COURSE RECORDS — live from get_career_leaderboard('crowns'). */}
      {crowns.isPending ? (
        pending(170)
      ) : crowns.isSuccess && crownsRows.length > 0 ? (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.heldNow', 'Held right now')}
          title={t('amateur.leaderboards.courseRecords', 'Course records')}
          meta={membersText(Number(crownsRows[0].total_members))}
        >
          {shortBoard(crownsRows, crownsSecondary, recordsCaption)}
          {crownsRows.length > SHORT_ROWS ? (
            <SeeAll label={seeAllMembers(Number(crownsRows[0].total_members))} onPress={() => setCareerSheet('crowns')} />
          ) : null}
        </Section>
      ) : null}

      {/* §9 TOP 100 GB&I — get_career_leaderboard('top_100_gbni_distinct'). */}
      {top100.isPending ? (
        pending(170)
      ) : top100.isSuccess && top100Rows.length > 0 ? (
        <Section
          contest
          eyebrow={t('amateur.leaderboards.theHundred', 'The hundred')}
          title={t('amateur.leaderboards.top100Gbi', 'Top 100 GB&I')}
          meta={membersText(Number(top100Rows[0].total_members))}
        >
          {shortBoard(top100Rows, top100Secondary, t('amateur.leaderboards.of100', 'of 100'))}
          {top100Rows.length > SHORT_ROWS ? (
            <SeeAll label={seeAllMembers(Number(top100Rows[0].total_members))} onPress={() => setCareerSheet('top100')} />
          ) : null}
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
          title={t(BOARD_LABELS[seeAll.board].i18n, BOARD_LABELS[seeAll.board].label)}
          onRowPress={onRowPress}
        />
      ) : null}

      <BottomSheet
        open={coursesSheet}
        onClose={() => setCoursesSheet(false)}
        maxHeight="85dvh"
        ariaLabelledBy="courses-see-all-title"
        style={{ height: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
      >
        <div style={{ flexShrink: 0, padding: '10px 16px 12px', borderBottom: `1px solid ${A.BORDER}` }}>
          <h2 id="courses-see-all-title" style={{ ...KICKER, margin: 0, color: A.INK }}>
            {t('amateur.leaderboards.yourCourses', 'Your courses')}
          </h2>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 32px' }}>
          {standing.rows.map((r, i, arr) => (
            <button
              key={r.course_id}
              type="button"
              onClick={() => { setCoursesSheet(false); onOpenCourse(r.course_id); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', border: 'none', borderBottom: i < arr.length - 1 ? `1px solid ${A.SOFT}` : 'none', background: 'transparent', textAlign: 'left', fontFamily: SANS, cursor: 'pointer' }}
            >
              <span style={{ minWidth: 0, fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: A.MUTE }}>
                {r.course_name ?? t('discover.unknownCourse', 'A course')}
              </span>
              <span style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>{standingFigures(r)}</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={careerSheet !== null}
        onClose={() => setCareerSheet(null)}
        maxHeight="85dvh"
        ariaLabelledBy="career-see-all-title"
        style={{ height: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
      >
        <div style={{ flexShrink: 0, padding: '10px 16px 12px', borderBottom: `1px solid ${A.BORDER}` }}>
          <h2 id="career-see-all-title" style={{ ...KICKER, margin: 0, color: A.INK }}>
            {careerSheet === 'top100'
              ? t('amateur.leaderboards.top100Gbi', 'Top 100 GB&I')
              : t('amateur.leaderboards.courseRecords', 'Course records')}
          </h2>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 32px' }}>
          {(careerSheet === 'top100' ? top100Rows : crownsRows).map((r, i, arr) => (
            <CompactRow
              key={r.user_id}
              pos={r.pos}
              tie={r.is_tie}
              id={r.user_id}
              name={nameOf(r.display_name)}
              photo={r.photo_url}
              secondary={careerSheet === 'top100' ? top100Secondary(r) : crownsSecondary(r)}
              value={String(r.value)}
              caption={careerSheet === 'top100' ? t('amateur.leaderboards.of100', 'of 100') : recordsCaption}
              self={!!r.is_viewer || r.user_id === userId}
              divider={i < arr.length - 1}
              onPress={() => {
                setCareerSheet(null);
                onOpenProfile(r.user_id);
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
