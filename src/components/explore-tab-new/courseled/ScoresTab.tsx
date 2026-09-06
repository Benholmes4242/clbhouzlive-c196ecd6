import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListFilter } from 'lucide-react';

import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { DISCOVER_STICKY_FILTER_Z } from '@/lib/zLayers';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { r } from '@/lib/radius';

import { DISCOVER_FACT, FIGS, SANS } from './tokens';
import { BoardHeaderRow, BoardRowView, gapText } from './BoardRows';
import { BoardFilterPanel } from './BoardFilterPanel';
import { BoardSeeAllSheet } from './BoardSeeAllSheet';
import { CoursesPlayedSeeAllSheet } from './CoursesPlayedSeeAllSheet';
import { CourseBoardHeaderRow, CourseBoardRows } from './CourseBoardRows';
import { HowTheyPlayedSection } from './HowTheyPlayedSection';
import { ListTerminalRow } from './ListTerminalRow';
import { describeFilterParts } from './GolfThisWeek';
import { useBoardFacets } from './hooks/useBoardFacets';
import { useBoardPage, type BoardRow } from './hooks/useBoardPage';
import { useBoardCourses } from './hooks/useBoardCourses';
import {
  BOARD_LABELS,
  COURSE_BOARD_KEYS,
  COURSE_BOARD_LABELS,
  DEFAULT_FILTERS,
  SCORES_MEMBER_BOARD_KEYS,
  normalizeFilters,
  filtersAreDefault,
  type BoardFilters,
  type BoardKey,
  type CourseBoardKey,
} from './boardFilters';

/**
 * SCORES — TWO EQUAL HALVES (BRIEF_SCORES_TWO_HALVES).
 *
 * A REFERENCE SURFACE, NOT A MAGAZINE. No hero, no editorial, no personal
 * dashboard: one filter states the question, and both halves — MEMBERS and
 * COURSES — answer it at the same weight.
 *
 * WHAT LEFT AND MUST NOT COME BACK:
 *   - the 216px leader hero and its pool rail (they took the whole first screen)
 *   - the four duplicate course tiles above the course list
 *   - boards hidden inside the filter sheet: ten member boards and six course
 *     boards are now VISIBLE rails, because a board a member cannot see is a
 *     board they do not know exists.
 *
 * ONE FILTER, TWO BOARDS. The member board key and the course board key are
 * COMPONENT STATE and are never passed to each other's read; both reset on entry
 * (S3.5). Neither is in the URL — a board tap is not a back-stack entry.
 *
 * RANKING IS STILL THE DATABASE'S JOB. get_board_page ranks members;
 * get_board_courses orders AND limits on its own axis (p_sort). Nothing here
 * re-sorts either result.
 */

/** S4.4 — eight member positions on the page; a tie at the cut is kept whole. */
const VISIBLE_POSITIONS = 8;
/** One read serves the page and the member's own pinned row (S4.6). */
const PAGE_FETCH = 200;
/** S5.4 — five course rows, and the read takes exactly what it shows. */
const COURSE_ROWS = 5;

export interface ScoresTabProps {
  userId: string | undefined;
  onRowPress?: (row: BoardRow) => void;
  onCoursePress?: (courseId: string) => void;
  onMemberPress?: (memberId: string) => void;
  /** Discover's route-owned fixed header supplies the sticky bar's offset. */
  belowDiscoverHeader?: boolean;
}

export function ScoresTab({
  userId,
  onRowPress,
  onCoursePress,
  onMemberPress,
  belowDiscoverHeader = false,
}: ScoresTabProps) {
  const { t } = useTranslation('courses');

  /* S3.5 — component state, reset on entry. The member half opens on the
     scoring board and the course half on most played; there is no rotation and
     no stored pick, so the page a member returns to is the page they left. */
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [board, setBoard] = useState<BoardKey>('topar');
  const [courseBoard, setCourseBoard] = useState<CourseBoardKey>('played');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [membersSeeAll, setMembersSeeAll] = useState(false);
  const [coursesSeeAll, setCoursesSeeAll] = useState(false);

  const membersRef = useRef<HTMLDivElement | null>(null);

  const facets = useBoardFacets(userId, board, filters);
  const page = useBoardPage(userId, board, filters, { limit: PAGE_FETCH });
  const courses = useBoardCourses(userId, filters, { limit: COURSE_ROWS, sort: courseBoard });

  const rows = page.data?.rows ?? [];
  const total = page.data?.total ?? 0;
  const visible = useMemo(() => rows.filter((row) => row.pos <= VISIBLE_POSITIONS), [rows]);
  const leader = rows[0] ?? null;
  const mine = useMemo(
    () => (userId ? rows.find((row) => row.user_id === userId) ?? null : null),
    [rows, userId],
  );
  const minePinned = !!mine && !visible.some((row) => row.user_id === mine.user_id);

  const courseRows = courses.data?.rows ?? [];
  const courseTotal = courses.data?.total ?? 0;

  /* S6.1 — THE SELECTED COURSE IS THE BOARD'S OWN FIRST ROW until the member
     picks another, and a filter or axis change re-seats it rather than stranding
     the analytics on a course the board no longer lists. */
  useEffect(() => {
    if (courseRows.length === 0) {
      if (selectedCourse !== null) setSelectedCourse(null);
      return;
    }
    if (!courseRows.some((row) => row.course_id === selectedCourse)) {
      setSelectedCourse(courseRows[0].course_id);
    }
  }, [courseRows, selectedCourse]);

  const selectedRow =
    courseRows.find((row) => row.course_id === selectedCourse) ?? courseRows[0] ?? null;

  const appliedParts = useMemo(() => describeFilterParts(filters, t as never), [filters, t]);

  const changeFilters = useCallback((next: BoardFilters) => {
    analyticsEvents.track('discover_board_filter_change', {
      scope: next.scope,
      window: next.window,
      courses: next.courses,
      band: next.band,
      competition: next.competition,
      region: next.regionKind ?? 'all',
    });
    setFilters(normalizeFilters(next));
    const el = membersRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, []);

  const changeBoard = useCallback((next: BoardKey) => {
    analyticsEvents.track('discover_board_category_change', { board: next });
    setBoard(next);
  }, []);

  const boardTitle = t(BOARD_LABELS[board].i18n, BOARD_LABELS[board].label);
  const memberUnit = t('discover.filterBoard.nRounds', '{{count}} rounds', { count: total });

  return (
    <section style={{ fontFamily: SANS, ...FIGS }}>
      {/* S2 — THE APPLIED FILTER, STICKY, GOVERNING BOTH HALVES. Settled chrome:
          full width, no radius, no shadow, hairlines top and bottom. */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={t('discover.filterBoard.open', 'Filter the board')}
        style={{
          position: 'sticky',
          top: belowDiscoverHeader ? 'var(--discover-header-h)' : 'var(--chrome-total-h, 55px)',
          zIndex: DISCOVER_STICKY_FILTER_Z,
          width: 'calc(100% + 28px)',
          /* S1.1 — 10px of clearance below the tab strip: the bar and the active
             tab's underline were touching and read as one element. */
          margin: '10px -14px 0',
          minHeight: 40,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxSizing: 'border-box',
          background: A.PANEL,
          border: 'none',
          borderBottom: `1px solid ${A.BORDER}`,
          borderRadius: 0,
          boxShadow: 'none',
          fontFamily: SANS,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            ...KICKER,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: A.BODY,
          }}
        >
          {appliedParts.join(' \u00B7 ')}
        </span>
        <span style={{ ...KICKER, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, color: A.INK }}>
          <ListFilter size={13} strokeWidth={2.4} aria-hidden />
          {t('discover.filterBoard.filters', 'Filters')}
        </span>
      </button>

      {/* ================= MEMBERS ================= */}
      <div
        ref={membersRef}
        style={{
          paddingTop: 18,
          scrollMarginTop: belowDiscoverHeader
            ? 'calc(var(--discover-header-h) + 48px)'
            : 'calc(var(--chrome-total-h, 55px) + 48px)',
        }}
      >
        <HalfHeading
          title={t('discover.scores.members', 'Members')}
          count={t('discover.filterBoard.nRounds', '{{count}} rounds', { count: total })}
        />
        <BoardRail
          keys={SCORES_MEMBER_BOARD_KEYS}
          activeKey={board}
          labelFor={(key) => t(BOARD_LABELS[key].i18n, BOARD_LABELS[key].label)}
          onSelect={changeBoard}
        />

        {page.isPending ? (
          <div style={{ height: 240 }} aria-hidden />
        ) : total === 0 ? (
          <EmptyHalf
            line={t('discover.filterBoard.emptyLine', 'Nothing on this board for {{line}}.', {
              line: appliedParts.join(' \u00B7 '),
            })}
            canReset={!filtersAreDefault(filters)}
            onReset={() => changeFilters({ ...DEFAULT_FILTERS })}
          />
        ) : (
          <>
            <BoardHeaderRow board={board} />
            {visible.map((row) => (
              <BoardRowView
                key={`${row.pos}:${row.whs_score_id ?? row.user_id}`}
                row={row}
                board={board}
                isSelf={!!userId && row.user_id === userId}
                onPress={onRowPress}
              />
            ))}
            {minePinned && mine && leader && (
              <div style={{ marginTop: 4 }}>
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
                label={t('discover.filterBoard.seeAll', 'See all {{unit}}', { unit: memberUnit })}
                onPress={() => setMembersSeeAll(true)}
              />
            )}
          </>
        )}
      </div>

      {/* ================= COURSES ================= */}
      <div style={{ paddingTop: 32 }}>
        <HalfHeading
          title={t('discover.scores.courses', 'Courses')}
          count={t('discover.coursesPlayed.nCourses', '{{count}} courses', { count: courseTotal })}
        />
        <BoardRail
          keys={COURSE_BOARD_KEYS}
          activeKey={courseBoard}
          labelFor={(key) => t(COURSE_BOARD_LABELS[key].i18n, COURSE_BOARD_LABELS[key].label)}
          onSelect={(key: CourseBoardKey) => setCourseBoard(key)}
        />

        {courses.isPending ? (
          <div style={{ height: 200 }} aria-hidden />
        ) : courseRows.length === 0 ? (
          <EmptyHalf
            line={t('discover.coursesPlayed.emptyLine', 'No courses played for {{line}}.', {
              line: appliedParts.join(' \u00B7 '),
            })}
            canReset={!filtersAreDefault(filters)}
            onReset={() => changeFilters({ ...DEFAULT_FILTERS })}
          />
        ) : (
          <>
            <CourseBoardHeaderRow board={courseBoard} />
            <CourseBoardRows
              rows={courseRows}
              board={courseBoard}
              selectedId={selectedRow?.course_id ?? null}
              onSelect={setSelectedCourse}
            />
            {courseTotal > courseRows.length && (
              <ListTerminalRow
                label={t('discover.coursesPlayed.seeAll', 'See all {{count}} courses', { count: courseTotal })}
                onPress={() => setCoursesSeeAll(true)}
              />
            )}

            {/* S6 — HOW THEY PLAYED. The selected row drives the unchanged
                analytics card; nothing about its internals is touched.
                BRIEF_SCORES_REFINEMENTS S2 — the section now also carries a
                full-catalogue course search, so "how does Woburn play" is
                answerable for a course nobody in the circuit has played. */}
            <HowTheyPlayedSection
              boardRow={selectedRow}
              userId={userId}
              filters={filters}
              onCoursePress={onCoursePress}
            />
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
        open={membersSeeAll}
        onClose={() => setMembersSeeAll(false)}
        userId={userId}
        board={board}
        filters={filters}
        appliedParts={appliedParts}
        title={boardTitle}
        onRowPress={onRowPress}
      />

      <CoursesPlayedSeeAllSheet
        open={coursesSeeAll}
        onClose={() => setCoursesSeeAll(false)}
        userId={userId}
        filters={filters}
        appliedParts={appliedParts}
        onCoursePress={onCoursePress}
        onMemberPress={onMemberPress}
      />
    </section>
  );
}

/**
 * S3.1 — THE TWO HALVES ARE HEADED IDENTICALLY. Same type, same weight, same
 * count treatment: equal weight is stated by the page, not implied by order.
 */
function HalfHeading({ title, count }: { title: string; count: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
      <h2
        style={{
          margin: 0,
          /* S1.2 — 17/800. On a reference surface the FIGURES carry the most
             weight; the labels above them must not be the largest type. */
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: '0.005em',
          textTransform: 'uppercase',
          color: DISCOVER_FACT,
        }}
      >
        {title}
      </h2>
      <span style={{ ...KICKER, color: A.MUTE, flexShrink: 0 }}>{count}</span>
    </div>
  );
}

/**
 * THE BOARD RAIL. One scrolling row of chips, breaking the page gutter so the
 * first chip lines up with the heading and the last can scroll clear of the edge.
 * The active chip is stated by INK ON PANEL, never by a colour: amber belongs to
 * the viewing member's own row.
 */
function BoardRail<K extends string>({
  keys,
  activeKey,
  labelFor,
  onSelect,
}: {
  keys: readonly K[];
  activeKey: K;
  labelFor: (key: K) => string;
  onSelect: (key: K) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        margin: '0 -14px 12px',
        padding: '0 14px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {keys.map((key) => {
        const active = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={active}
            style={{
              flexShrink: 0,
              /* S1.3 — 12/700, 6 by 11: five and a half chips visible is what
                 says the rail scrolls. */
              padding: '6px 11px',
              borderRadius: r.xs,
              border: `1px solid ${active ? 'transparent' : A.BORDER}`,
              background: active ? A.INK : 'transparent',
              color: active ? A.CANVAS : A.MUTE,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {labelFor(key)}
          </button>
        );
      })}
    </div>
  );
}

function EmptyHalf({
  line,
  canReset,
  onReset,
}: {
  line: string;
  canReset: boolean;
  onReset: () => void;
}) {
  const { t } = useTranslation('courses');
  return (
    <div style={{ padding: '18px 2px' }}>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: DISCOVER_FACT }}>{line}</p>
      {canReset && (
        <button
          type="button"
          onClick={onReset}
          style={{
            marginTop: 12,
            padding: '9px 14px',
            borderRadius: r.xs,
            border: `1px solid ${A.BORDER}`,
            background: A.PANEL,
            color: DISCOVER_FACT,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {t('discover.filterBoard.clearFilters', 'Clear filters')}
        </button>
      )}
    </div>
  );
}

export default ScoresTab;
