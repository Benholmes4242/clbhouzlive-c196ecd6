import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ListFilter } from 'lucide-react';

import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { DISCOVER_STICKY_FILTER_Z } from '@/lib/zLayers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { DISCOVER_FACT, DISCOVER_QUIET, FIGS, SANS } from './tokens';
import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useBoardFacets } from './hooks/useBoardFacets';
import { useBoardPage, type BoardRow } from './hooks/useBoardPage';
import { BoardHeaderRow, BoardRowView, gapText } from './BoardRows';
import { BoardFilterPanel } from './BoardFilterPanel';
import { BoardSeeAllSheet } from './BoardSeeAllSheet';
import { ListTerminalRow } from './ListTerminalRow';
/* F1 — the day's FIRST session lands on the handicap default; later sessions
   the same day rotate. One hook decides which. */
import { useDiscoverEntryBoard } from './hooks/useDiscoverEntryBoard';
import { DEFAULT_BOARD_FALLBACK } from './hooks/useHandicapDefaultBoard';

import {
  BAND_OPTIONS,
  BOARD_LABELS,
  COURSES_SET_OPTIONS,
  COMPETITION_OPTIONS,
  DEFAULT_FILTERS,
  SCOPE_OPTIONS,
  WINDOW_OPTIONS,
  filtersAreDefault,
  type BoardFilters,
  type BoardKey,
} from './boardFilters';

/**
 * THE DISCOVER BOARD — FILTER-LED (BRIEF_DISCOVER_FILTER_LED_BOARD).
 *
 * WHAT THIS SURFACE NOW IS: one ranked board, seven categories, and a filter
 * panel that answers WHO and NARROW IT. The member states the question; the
 * DATABASE answers it.
 *
 * WHAT LEFT, AND MUST NOT COME BACK (S8):
 *   - the scope pill row and the region well  absorbed into the filter panel
 *   - the round-card rail ("Recent rounds")   the board is the section now
 *   - the honours board rail and its sheet    feats are a filter axis (S3.5),
 *                                             and the honours TREATMENT moved to
 *                                             the scorecard sheet (S5.6)
 *   - client-side ranking, ordering, dedupe, spreadCourses, GOLF_WEEK_FETCH
 *
 * WHY THE CLIENT NO LONGER RANKS (S1): the old surface fetched the most recent
 * 120 rounds and sorted them in the browser, so "lowest gross, all time" was
 * really "lowest gross among the last 120 rounds" — a wrong answer that looked
 * like a right one. get_board_page ranks over the whole qualifying set and
 * returns `pos`, `is_tie` and `total_count`; NOTHING HERE RE-SORTS ITS OUTPUT.
 *
 * ONE BOARD ON SCREEN, ALWAYS (S4.3). Seven boards, one at a time, chosen from
 * the filter panel. An empty board is a SENTENCE, never a hidden section:
 * a board that disappears when a filter bites teaches a member nothing.
 */

/** Ten POSITIONS on the page. A tie crossing T10 is kept whole. */
const VISIBLE_POSITIONS = 10;

/**
 * ONE READ SERVES THE PAGE AND THE PIN. The page shows ten positions; the read takes
 * two hundred so the member's own row can be FOUND and pinned without a second
 * query (S5.4). Past two hundred the pin is simply absent — a member ranked
 * 300th is told their position by the see-all sheet, not by a third round trip.
 */
const PAGE_FETCH = 200;

const HERO_H = 300;

export interface GolfThisWeekProps {
  userId: string | undefined;
  /** A row is a ROUND: the host opens the scorecard sheet for it. */
  onRowPress?: (row: BoardRow) => void;
  /**
   * BRIEF_DISCOVER_COURSES_SECTION C2.1 — ONE FILTER BAR GOVERNS THE PAGE, and
   * this is the only way out of it. Sections below (Courses played) READ the
   * applied filter state and never write to it. Null until the handicap default
   * has landed, because unresolved is not absent.
   *
   * THE BOARD KEY IS NOT REPORTED (C2.2): it is separate state here and stays
   * here, so no consumer can scope itself by the leaderboard on screen.
   */
  onAppliedFiltersChange?: (filters: BoardFilters | null) => void;
  /**
   * G1.1 — THE GOVERNED REGION. Sections that the filter bar governs render as
   * children of this section so the sticky bar's containing block spans them and
   * it stays pinned to the bottom of the region. They are NOT given the board
   * key (G6.2) and carry no filter control of their own (G6.1).
   */
  children?: ReactNode;
}

export function GolfThisWeek({ userId, onRowPress, onAppliedFiltersChange, children }: GolfThisWeekProps) {
  const { t } = useTranslation('courses');

  /* COMPONENT STATE, NEVER THE URL — a filter tap must not enter the back
     stack, which is the rule the retired scope pills already held. */
  /* F1 — THE LANDING COMBINATION: the day's first session is the member's own
     handicap default, every later session that day is a rotated board. This
     component owns the APPLIED combination; the entry pick only supplies its
     INITIAL value, and the first drawer change (F4.1) puts it out of the way
     for the rest of the session. */
  const entry = useDiscoverEntryBoard(userId);
  const [pickedBoard, setBoard] = useState<BoardKey | null>(null);
  const [pickedFilters, setFilters] = useState<BoardFilters | null>(null);

  /* Nothing is special-cased downstream: the entry pick is applied as a board
     plus the standard filters, exactly as a member's own selection would be
     (F3.2 — only the board and the window can differ). */
  useEffect(() => {
    if (pickedBoard || !entry.resolved || !entry.board) return;
    setBoard(entry.board);
    setFilters({ ...DEFAULT_FILTERS, window: entry.window });
  }, [pickedBoard, entry.resolved, entry.board, entry.window]);

  /* H4.2 — BEFORE THE INDEX RESOLVES THERE IS NO BOARD. The reads stay parked
     and the section holds its loading state rather than rendering gross and
     swapping it out from under the member. */
  const ready = pickedBoard !== null && pickedFilters !== null;
  const board = pickedBoard ?? DEFAULT_BOARD_FALLBACK;
  const filters = pickedFilters ?? DEFAULT_FILTERS;

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [seeAll, setSeeAll] = useState(false);

  /* C2.1 — publish the applied FILTERS ONLY, never the board. */
  useEffect(() => {
    onAppliedFiltersChange?.(pickedFilters);
  }, [pickedFilters, onAppliedFiltersChange]);

  const facets = useBoardFacets(userId, board, filters, { enabled: ready });
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH, enabled: ready });

  const rows = page.data?.rows ?? [];
  const total = page.data?.total ?? 0;
  const visible = useMemo(
    () => rows.filter((row) => row.pos <= VISIBLE_POSITIONS),
    [rows],
  );

  /* S5.4 — the member's own row, pinned only when it is NOT already on screen. */
  const mine = useMemo(
    () => (userId ? rows.find((r) => r.user_id === userId) ?? null : null),
    [rows, userId],
  );
  const minePinned = !!mine && !visible.some((row) => row.user_id === mine.user_id);

  /* S6.1 — THE HERO IS THE LEADER'S COURSE. Not a rotation, not a curated
     photograph: the board's own first row supplies the image, so the picture
     always belongs to the answer beneath it. */
  const leader = rows[0] ?? null;
  const heroCourseIds = useMemo(
    () => (leader?.course_id ? [leader.course_id] : []),
    [leader?.course_id],
  );
  const heroMeta = useCourseCardMeta(heroCourseIds);
  const heroImage = leader?.course_id
    ? heroMeta.data?.get(leader.course_id)?.imageUrl ?? null
    : null;

  /* S6.2 — THE RAIL DESCRIBES THE POOL THE BOARD IS DRAWN FROM, not the ranked
     rows it rendered. pool_rounds/pool_courses/pool_members are identical on
     every board for the same filter state because they describe the qualifying
     set. total_count stays reserved for the ranked row count (See all, filter
     footer, sheet subject block). */
  const pool = page.data?.pool ?? { rounds: 0, courses: 0, members: 0 };
  const days = windowDays(filters.window);

  const appliedParts = useMemo(
    () => describeFilterParts(filters, t as never),
    [filters, t],
  );
  const changeBoard = useCallback((next: BoardKey) => {
    analyticsEvents.track('discover_board_category_change', { board: next });
    setBoard(next);
  }, []);

  const changeFilters = useCallback((next: BoardFilters) => {
    analyticsEvents.track('discover_board_filter_change', {
      scope: next.scope,
      window: next.window,
      courses: next.courses,
      band: next.band,
      competition: next.competition,
      region: next.regionKind ?? 'all',
    });
    setFilters(next);
    /* G1.5 — THE BAR MUST NEVER SIT ON TOP OF THE FIRST ROW. When the list
       re-renders under a stuck bar, bring the board's own top back to just
       below it (scroll-margin carries the bar height), so whatever position the
       member was at, the row under the bar stays readable. */
    const el = boardRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, []);

  /* B1 — A FEAT IS A BOARD, so its title comes from the same place as any
     other board's and no second vocabulary exists. */
  const boardTitle = t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label);

  const unitCount = t('discover.filterBoard.nRounds', '{{count}} rounds', { count: total });

  return (
    <section style={{ margin: '0 -14px', fontFamily: SANS, ...FIGS }}>
      <div
        style={{
          position: 'relative',
          height: `calc(${HERO_H}px + env(safe-area-inset-top, 0px))`,
          overflow: 'hidden',
          background: A.PANEL,
        }}
      >
        <CourseImageFallback
          courseId={leader?.course_id ?? null}
          courseName={leader?.course_name ?? null}
          imageUrl={heroImage}
          pending={heroCourseIds.length > 0 && heroMeta.isPending}
          initialsSize={34}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, ${A.CANVAS} 0%, rgba(21,23,31,0.82) 20%, rgba(21,23,31,0.34) 58%, rgba(21,23,31,0.08) 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 'env(safe-area-inset-top, 0px) 14px 16px',
          }}
        >
          <span style={{ ...KICKER, color: A.BODY }}>
            {t('discover.board.circuitEyebrow', 'The amateur circuit')}
          </span>
          <h2 style={{ margin: '6px 0 0', fontSize: 25, fontWeight: 700, letterSpacing: '0.005em', textTransform: 'uppercase', color: DISCOVER_FACT }}>
            {ready ? boardTitle : '\u00a0'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 12, whiteSpace: 'nowrap', visibility: ready ? 'visible' : 'hidden' }}>
            <Stat value={String(total)} label={t('discover.filterBoard.col.rounds', 'ROUNDS')} />
            <Stat value={String(courseCount)} label={t('discover.filterBoard.col.courses', 'COURSES')} />
            <Stat value={String(memberCount)} label={t('discover.filterBoard.col.members', 'MEMBERS')} />
            <Stat value={days} label={t('discover.filterBoard.col.days', 'DAYS')} />
          </div>
        </div>
      </div>

      {/* G1 — THE BAR STICKS. It scrolls up with the hero first, then pins
          BENEATH the app chrome: `--chrome-total-h` composes --header-h, --sat
          (env(safe-area-inset-top)) and --shell-extra-h, so the bar can never
          enter the notch and never needs a hardcoded number (G1.2).
          Its containing block is this <section>, which now also holds the
          sections below the board (see `children`), so it stays pinned for the
          rest of the governed region (G1.1). z-index comes from the registry
          (G1.6) and is the lowest entry there: every sheet, the filter panel and
          the fullscreen viewer cover it completely. */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={t('discover.filterBoard.open', 'Filter the board')}
        style={{
          position: 'sticky',
          top: 'var(--chrome-total-h, 55px)',
          zIndex: DISCOVER_STICKY_FILTER_Z,
          width: '100%', minHeight: 48, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12,
          background: A.PANEL, border: 'none', borderTop: `1px solid ${A.BORDER}`,
          /* G1.3 — settled chrome, not a floating card: full width, no radius,
             no shadow, the hairline on the BOTTOM edge. */
          borderBottom: `1px solid ${A.BORDER}`, borderRadius: 0, boxShadow: 'none',
          fontFamily: SANS, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ ...KICKER, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: A.BODY }}>
          {ready && <AppliedFilterLine parts={appliedParts} />}
        </span>
        <span style={{ ...KICKER, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, color: A.INK }}>
          <ListFilter size={13} strokeWidth={2.4} aria-hidden />
          {t('discover.filterBoard.filters', 'Filters')}
        </span>
      </button>

      {/* THE BOARD */}
      <div ref={boardRef} style={{ marginTop: 16, padding: '0 14px', scrollMarginTop: 'calc(var(--chrome-total-h, 55px) + 56px)' }}>

        {!ready || page.isPending ? (
          <div style={{ height: 240 }} aria-hidden />
        ) : total === 0 ? (
          <EmptyAnswer board={board} filters={filters} onReset={() => changeFilters({ ...DEFAULT_FILTERS })} />
        ) : (
          <>
            <BoardHeaderRow board={board} />
            {visible.map((r) => (
              <BoardRowView
                key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
                row={r}
                board={board}
                isSelf={!!userId && r.user_id === userId}
                onPress={onRowPress}
              />
            ))}
            {minePinned && mine && leader && (
              <div style={{ marginTop: 6, borderTop: `1px solid ${A.BORDER}` }}>
                <BoardRowView
                  row={mine}
                  board={board}
                  isSelf
                  gap={gapText(board, mine, leader, t as never)}
                  onPress={onRowPress}
                />
              </div>
            )}
            {total > visible.length && (
              <ListTerminalRow
                label={t('discover.filterBoard.seeAll', 'See all {{unit}}', { unit: unitCount })}
                onPress={() => setSeeAll(true)}
              />
            )}
          </>
        )}
      </div>

      {/* R4 — the shared terminal row ends the board. The courses masthead is
          the next break, after one deliberate 30px step and no duplicate rule. */}
      {children ? (
        <div style={{ marginTop: 30, padding: '0 14px' }}>
          {children}
        </div>
      ) : null}



      <BoardFilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        userId={userId}
        board={board}
        onBoardChange={changeBoard}
        resultCount={total}
        filters={filters}
        onChange={changeFilters}
        facets={facets}
      />

      <BoardSeeAllSheet
        open={seeAll}
        onClose={() => setSeeAll(false)}
        userId={userId}
        board={board}
        filters={filters}
        appliedParts={appliedParts}
        title={boardTitle}
        onRowPress={onRowPress}
      />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span className="tabular-nums" style={{ fontSize: 17, fontWeight: 700, color: DISCOVER_FACT, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ ...KICKER, color: A.MUTE }}>
        {label}
      </span>
    </span>
  );
}

function AppliedFilterLine({ parts }: { parts: string[] }) {
  return <>{parts.map((part, index) => <span key={`${part}:${index}`}>{index > 0 ? <> {'\u00B7'} </> : null}{part}</span>)}</>;
}

export function windowDays(window: BoardFilters['window']): string {
  if (window === 'all') return '\u221e';
  if (window !== 'year') return window;
  const now = new Date();
  const yearStart = Date.UTC(now.getUTCFullYear(), 0, 1);
  return String(Math.floor((Date.now() - yearStart) / 86_400_000) + 1);
}

/**
 * S5.2 — THE APPLIED LINE. Prose, not chips: "Everyone, last 14 days" reads as a
 * sentence a member can check, and every non-default axis appears in it.
 */
export function describeFilterParts(
  f: BoardFilters,
  t: (k: string, d?: string, o?: object) => string,
): string[] {
  const parts: string[] = [];
  const scope = SCOPE_OPTIONS.find((o) => o.key === f.scope);
  if (scope) parts.push(t(scope.i18n, scope.label));
  const win = WINDOW_OPTIONS.find((o) => o.key === f.window);
  if (win) parts.push(t(win.i18n, win.label));
  if (f.regionValue) parts.push(f.regionValue);
  if (f.courses === 'one') parts.push(t('discover.filterBoard.courses.oneCourse', 'one course'));
  else if (f.courses !== 'any') {
    const c = COURSES_SET_OPTIONS.find((o) => o.key === f.courses);
    if (c) parts.push(t(c.i18n, c.label));
  }
  if (f.band !== 'any') {
    const b = BAND_OPTIONS.find((o) => o.key === f.band);
    if (b) parts.push(t(b.i18n, b.label));
  }
  /* B3.4 — COMPETITION JOINS THE APPLIED LINE when set. */
  if (f.competition !== 'any') {
    const c = COMPETITION_OPTIONS.find((o) => o.key === f.competition);
    if (c) parts.push(t(c.i18n, c.label));
  }
  return parts;
}

export function describeFilters(
  f: BoardFilters,
  t: (k: string, d?: string, o?: object) => string,
): string {
  return describeFilterParts(f, t).join(' \u00B7 ');
}

/**
 * S7 — THE EMPTY ANSWER NAMES THE FILTERS THAT MADE IT EMPTY and offers the way
 * back. "No rounds" on its own is the fault this replaces: it read as a broken
 * board rather than as a narrow question.
 */
function EmptyAnswer({
  board,
  filters,
  onReset,
}: {
  board: BoardKey;
  filters: BoardFilters;
  onReset: () => void;
}) {
  const { t } = useTranslation('courses');
  const line = describeFilters(filters, t as never);
  const floor =
    board === 'stableford'
      ? t('discover.filterBoard.floorStableford', 'This board only counts rounds of 36 points or better.')
      : board === 'birdies'
        ? t('discover.filterBoard.floorBirdies', 'This board only counts rounds with three birdies or more.')
        : null;

  return (
    <div style={{ padding: '18px 2px' }}>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: DISCOVER_FACT }}>
        {t('discover.filterBoard.emptyLine', 'Nothing on this board for {{line}}.', { line })}
      </p>
      {floor && (
        <p style={{ margin: '6px 0 0', fontSize: 12.5, fontWeight: 500, color: DISCOVER_QUIET }}>
          {floor}
        </p>
      )}
      {!filtersAreDefault(filters) && (
        <button
          type="button"
          onClick={onReset}
          style={{
            marginTop: 12,
            padding: '9px 14px',
            borderRadius: 8,
            border: `1px solid ${A.BORDER}`,
            background: A.PANEL,
            color: DISCOVER_FACT,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('discover.filterBoard.reset', 'Reset all filters')}
        </button>
      )}
    </div>
  );
}

export default GolfThisWeek;
