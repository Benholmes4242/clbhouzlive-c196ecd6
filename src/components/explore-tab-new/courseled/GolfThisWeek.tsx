import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListFilter } from 'lucide-react';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { A, DISCOVER_FACT, DISCOVER_QUIET, FIGS, SANS } from './tokens';
import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useBoardFacets } from './hooks/useBoardFacets';
import { useBoardPage, type BoardRow } from './hooks/useBoardPage';
import { BoardHeaderRow, BoardRowView, gapText } from './BoardRows';
import { BoardFilterPanel } from './BoardFilterPanel';
import { BoardSeeAllSheet } from './BoardSeeAllSheet';
import {
  BAND_OPTIONS,
  BOARD_LABELS,
  COURSES_SET_OPTIONS,
  DEFAULT_FILTERS,
  FEAT_OPTIONS,
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
}

export function GolfThisWeek({ userId, onRowPress }: GolfThisWeekProps) {
  const { t } = useTranslation('courses');

  /* COMPONENT STATE, NEVER THE URL — a filter tap must not enter the back
     stack, which is the rule the retired scope pills already held. */
  const [board, setBoard] = useState<BoardKey>('gross');
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [seeAll, setSeeAll] = useState(false);

  const facets = useBoardFacets(userId, board, filters);
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH });

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

  /* S6.2 — THE RAIL AND THE SEE-ALL FIGURE ARE THE SAME NUMBER. total_count is
     the RPC's own count for the whole board; the courses figure is the size of
     the facet's course axis, which is counted over the same qualifying set. */
  const courseCount = facets.openList('course').length;
  const memberCount = facets.countFor('board', 'gross') ?? new Set(rows.map((row) => row.user_id)).size;
  const days = windowDays(filters.window);

  const appliedParts = useMemo(
    () => describeFilterParts(filters, t as never),
    [filters, t],
  );
  const appliedLine = appliedParts.join(' \u00B7 ');

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
      feat: next.feat,
      region: next.regionKind ?? 'all',
    });
    setFilters(next);
  }, []);

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
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: DISCOVER_QUIET }}>
            {t('discover.filterBoard.eyebrow', 'The board')}
          </span>
          <h2 style={{ margin: '6px 0 0', fontSize: 25, fontWeight: 700, color: DISCOVER_FACT }}>
            {t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label)}
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 12, whiteSpace: 'nowrap' }}>
            <Stat value={String(total)} label={t('discover.filterBoard.col.rounds', 'ROUNDS')} />
            <Stat value={String(courseCount)} label={t('discover.filterBoard.col.courses', 'COURSES')} />
            <Stat value={String(memberCount)} label={t('discover.filterBoard.col.members', 'MEMBERS')} />
            <Stat value={days} label={t('discover.filterBoard.col.days', 'DAYS')} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={t('discover.filterBoard.open', 'Filter the board')}
        style={{
          width: '100%', minHeight: 48, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12,
          background: A.PANEL, border: 'none', borderTop: `1px solid ${A.BORDER}`,
          borderBottom: `1px solid ${A.BORDER}`, fontFamily: SANS, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: A.BODY }}>
          <AppliedFilterLine parts={appliedParts} />
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, fontSize: 9, fontWeight: 700, color: A.AMBER, textTransform: 'uppercase' }}>
          <ListFilter size={13} strokeWidth={2.4} aria-hidden />
          {t('discover.filterBoard.filters', 'Filters')}
        </span>
      </button>

      {/* THE BOARD */}
      <div style={{ marginTop: 16, padding: '0 14px' }}>
        {page.isPending ? (
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
              <button
                type="button"
                onClick={() => setSeeAll(true)}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  background: 'transparent',
                  border: 'none',
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: DISCOVER_QUIET,
                  cursor: 'pointer',
                }}
              >
                {t('discover.filterBoard.seeAll', 'See all {{unit}}', { unit: unitCount })}
              </button>
            )}
          </>
        )}
      </div>

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
        appliedLine={appliedLine}
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
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: DISCOVER_QUIET }}>
        {label}
      </span>
    </span>
  );
}

function AppliedFilterLine({ parts }: { parts: string[] }) {
  return <>{parts.map((part, index) => <span key={`${part}:${index}`}>{index > 0 ? <> {'\u00B7'} </> : null}{part}</span>)}</>;
}

function windowDays(window: BoardFilters['window']): string {
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
  if (win) parts.push(t(win.i18n, win.label).toLowerCase());
  if (f.regionValue) parts.push(f.regionValue);
  if (f.courses === 'one') parts.push(t('discover.filterBoard.courses.oneCourse', 'one course'));
  else if (f.courses !== 'any') {
    const c = COURSES_SET_OPTIONS.find((o) => o.key === f.courses);
    if (c) parts.push(t(c.i18n, c.label).toLowerCase());
  }
  if (f.band !== 'any') {
    const b = BAND_OPTIONS.find((o) => o.key === f.band);
    if (b) parts.push(t(b.i18n, b.label).toLowerCase());
  }
  if (f.feat !== 'any') {
    const ft = FEAT_OPTIONS.find((o) => o.key === f.feat);
    if (ft) parts.push(t(ft.i18n, ft.label).toLowerCase());
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
