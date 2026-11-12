import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { useMemo, useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { ExploreSheetShell } from '@/components/explore-tab-new/courseled/ExploreSheetShell';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { StandoutRounds, type RoundPressTarget } from '@/components/explore-tab-new/courseled/StandoutRounds';
import { CompetitionBoards } from '@/components/explore-tab-new/courseled/CompetitionBoards';
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
import { useMyProStatus } from '@/features/pro-verification/useMyProStatus';
import { proGateStatus } from '@/features/pro-verification/proRules';
import { roundsPageHeld } from './roundsPageHold';
import { useStandoutRounds } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { RARE_AIR, rareAirPlaceholderHeight } from './rareAir';
import { RareAirLede, RareAirRail, RareAirYou } from './RareAirSection';
import { GUTTER, Section, SeeAll } from './Section';
import { CLIMB, climbCross, climbOrder, climbPlaceholderHeight, type ClimbMode, type ClimbPlaced } from './climb';
import { formatMonthLong } from '@/i18n/format';
import { LeaderboardsSection } from './LeaderboardsSection';

/** CompactRow value size (the Top 100 and improvement sections). */
export const ROW_VALUE_SIZE = SEASON_ROW_METRICS.figureSize;

/**
 * THE ROUNDS PAGE (BRIEF — THE LEADERBOARDS PAGE, structure A; EX1).
 *
 * EVERY SECTION ANSWERS A DIFFERENT QUESTION. Scope governs Standout rounds,
 * Competitions and CB27's remounted Leaderboards only.
 * Sections, in order: head
 * (scope chips), Standout rounds, Competitions, Leaderboards, §5 Feats this
 * year, §4 Most improved — the two below are
 * platform facts. The order alternates section SHAPE (rows,
 * tiles, rows, carousel) so no two neighbours read alike; anything added
 * here is placed by its shape, not its subject. § numbers name sections, not
 * Just played was removed (founder decision, 2026-10-22); Leaderboards' Most recent board covers it.
 * positions. Each section owns its read, holds its
 * own height while pending, and renders NOTHING when its read fails or is empty.
 */

/* The remaining control row keeps its existing gutter. T100 moved only §7. */
const HEAD_GUTTER = 16;
const SLAB_BG = 'rgba(255,255,255,0.05)';
const SHORT_ROWS = 3;
/** Faint ink: no separate token exists; DIM is the faintest analytical ink. */
const FAINT = A.DIM;

/* ---------------------------------------------------------------- reads */

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
  captionTone,
  valueTone,
  self,
  gapAbove,
  onPress,
  blurFigures = false,
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
  /** Only index/score figures, not Top 100 course counts. */
  blurFigures?: boolean;
  caption?: string | null;
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
          <InlineProMemberName userId={id}>{name}</InlineProMemberName>
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

      </span>
      <span style={{ flexShrink: 0, textAlign: 'right' }}>
        <span data-gate-blur={blurFigures ? '' : undefined} className="tabular-nums" style={{ display: 'block', fontSize: ROW_VALUE_SIZE, fontWeight: SEASON_ROW_METRICS.figureWeight, letterSpacing: SEASON_ROW_METRICS.figureTracking, lineHeight: caption ? SEASON_ROW_METRICS.figureLine : undefined, color: valueTone ?? A.INK }}>
          {value}
        </span>
        {caption ? (
          <span data-gate-blur={blurFigures ? '' : undefined} className="tabular-nums" style={{ display: 'block', fontSize: SEASON_ROW_METRICS.secondarySize, fontWeight: SEASON_ROW_METRICS.secondaryWeight, lineHeight: SEASON_ROW_METRICS.secondaryLine, color: captionTone ?? A.DIM }}>
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
  sessionKnown = true,
}: {
  userId: string | undefined;
  /** CB44 — false while the session is not yet known; that is undecided, never signed out. */
  sessionKnown?: boolean;
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

  const [seeAll, setSeeAll] = useState<{ board: BoardKey; filters: BoardFilters } | null>(null);

  /* CB13 — THE HANDICAP GATE. The one added read: the member's own connection
     (the same useWhsConnection every other surface shares, so it is usually
     already cached). The four states and the predicate live in RoundsGate.tsx.
     The page's own queries are untouched: gated, they run live behind the
     frost; connected, nothing changes. */
  const connection = useWhsConnection(userId);
  /* BRIEF 1 §7 — the pro status joins the shared predicate: a verified pro is
     never gated, a pending pro gets the 'proPending' hold. */
  const proStatus = useMyProStatus(userId);
  const gate = roundsGateState(userId, connection, proGateStatus(proStatus));

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
        blurFigures
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
  // A disabled read (guests: pending + idle) is not a load — no placeholder
  // held open; the section is absent exactly as for a member with no data.
  const featsHeld = featsYear.isPending && featsYear.fetchStatus === 'idle';
  const featsFirstLoad = !featsYear.isSuccess && featRows.length === 0 && !featsHeld;

  const pending = (h: number) => <div aria-hidden style={{ height: h, marginInline: GUTTER, marginBottom: 24 }} />;

  /* CB44 — the page's own observer of In form's read: same key and enabled
     flag as StandoutRounds, so react-query dedupes it to one request. */
  const inForm = useStandoutRounds(userId, state.filters, state.ready);
  const held = roundsPageHeld({
    sessionKnown,
    signedIn: !!userId,
    gate,
    boardReady: state.ready,
    inFormPending: inForm.isPending,
  });

  /* CB44 — THE HOLD (supersedes the CB13 state-2 shell). Only the three sized
     section placeholders: no scope switch (CB39 hides it when gated, so it
     would appear then vanish) and nothing for In form (it can settle absent).
     No transition: the settled page replaces this in one paint. */
  if (held) {
    return (
      <div data-rounds-hold="" style={{ fontFamily: SANS }}>
        {pending(rareAirPlaceholderHeight(!!userId))}
        {pending(climbPlaceholderHeight(SHORT_ROWS))}
      </div>
    );
  }


  const pageBody = (
    <div style={{ fontFamily: SANS }}>
      {/* CB27 remounts six ranking choices and the shared rows/read/facet counts.
          EX1's basis, you slab and Filters pill remain unmounted; the existing
          scope control governs all four scoped sections. */}
      {state.ready ? (
        <>
          {/* CB39 — a gated member cannot appear on any board, so the scope
              switch is not rendered; the sections below move up into its space. */}
          {gate !== 'gated' ? (
            <div data-scores-control-row style={{ display: 'flex', alignItems: 'center', gap: 9, padding: `0 ${HEAD_GUTTER}px 12px` }}>
              <ScopeSegments scope={scope} clubApplies={state.clubApplies} onScopeChange={state.changeScope} style={{ flex: 1, minWidth: 0 }} />
            </div>
          ) : null}
          <StandoutRounds viewerId={userId} filters={state.filters} enabled={state.ready} onRowPress={onRowPress} />
          <CompetitionBoards viewerId={userId} scope={state.filters.scope} enabled={state.ready} onRowPress={onRowPress} />
          <LeaderboardsSection state={state} viewerId={userId} onRowPress={onRowPress}
            onSeeAll={(board) => setSeeAll({ board, filters: state.filters })} />
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

      <ExploreSheetShell
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
      </ExploreSheetShell>

    </div>
  );

  /* CB13 states 1 and 4 return the page untouched; state 3 frosts it. BRIEF 1
     §7 adds the proPending hold, which frosts with the waiting copy and no
     Connect action. */
  if (gate === 'gated' || gate === 'proPending') {
    /* CB36 — the gate's count is the landing board read's own pool_rounds
       (get_board_page, already issued for the glimpse): no new query. Only a
       settled fortnight read counts; otherwise the gate keeps its sentence. */
    const pool = state.page.isSuccess && state.filters.window === '14' ? state.page.data?.pool.rounds ?? null : null;
    return <RoundsGate roundCount={pool} scope={state.filters.scope} proPending={gate === 'proPending'}>{pageBody}</RoundsGate>;
  }
  return pageBody;
}
