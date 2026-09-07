import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CourseBoardRows } from '@/components/explore-tab-new/courseled/CourseBoardRows';
import { CoursesPlayedSeeAllSheet } from '@/components/explore-tab-new/courseled/CoursesPlayedSeeAllSheet';
import { ListTerminalRow } from '@/components/explore-tab-new/courseled/ListTerminalRow';
import { describeFilterParts } from '@/components/explore-tab-new/courseled/GolfThisWeek';
import { useBoardCourses } from '@/components/explore-tab-new/courseled/hooks/useBoardCourses';
import {
  COURSE_BOARD_KEYS,
  COURSE_BOARD_LABELS,
  filtersAreDefault,
  type CourseBoardKey,
} from '@/components/explore-tab-new/courseled/boardFilters';
import { DISCOVER_FACT, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { RailChips } from '@/components/ui/RailChips';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';

import type { AmateurBoardState } from './useAmateurBoardState';

/**
 * BLOCK 2 - THE COURSES (BRIEF_AMATEUR_PAGE).
 *
 * THE SAME FILTER AS BLOCK 1, ITS OWN AXIS. get_board_courses takes the page's
 * filter state field by field and never the member board key, so where members
 * are playing is not a function of which leaderboard is on screen.
 *
 * THE WHOLE ROW IS THE TAP TARGET, straight to that course's page - no chevron,
 * no expand, no selection state - because CourseBoardRows is the deployed row
 * and this block does not rebuild it. Counts come from the shared plural keys,
 * so it is "1 member", never "1 MEMBERS".
 *
 * CAPPED WITH A SEE-ALL, same grammar as the leaderboard: five rows here, the
 * remainder in the sheet, and the sheet is the deployed one.
 */

/** Five rows on the page; the see-all sheet holds the remainder. */
const COURSE_ROWS = 5;

export function AmateurCoursesBlock({
  userId,
  state,
  onCoursePress,
}: {
  userId: string | undefined;
  state: AmateurBoardState;
  onCoursePress: (courseId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const [seeAll, setSeeAll] = useState(false);

  const { filters, courseBoard, ready } = state;
  const courses = useBoardCourses(userId, filters, {
    limit: COURSE_ROWS,
    sort: courseBoard,
    enabled: ready,
  });

  const rows = courses.data?.rows ?? [];
  const total = courses.data?.total ?? 0;

  const appliedParts = useMemo(() => describeFilterParts(filters, t as never), [filters, t]);
  const title = t(COURSE_BOARD_LABELS[courseBoard].i18n, COURSE_BOARD_LABELS[courseBoard].label);
  /* The shared plural key, so a single course reads "1 course". */
  const unit = t('discover.coursesPlayed.nCourses', '{{count}} courses', { count: total });

  /* A SINGLE-COURSE FILTER ANSWERS "WHERE" ALREADY, so the block goes away
     rather than stating one row back to the member. The RPC hook disables
     itself on that filter; the block must not render an empty state for it. */
  if (filters.courses === 'one') return null;

  return (
    <section style={{ paddingTop: 26, fontFamily: SANS, ...FIGS }}>
      <DiscoverSectionHeading title={title} right={unit} />

      <RailChips
        options={COURSE_BOARD_KEYS.map((key) => ({
          id: key,
          label: t(COURSE_BOARD_LABELS[key].i18n, COURSE_BOARD_LABELS[key].label),
        }))}
        value={courseBoard}
        onChange={(next) => state.changeCourseBoard(next as CourseBoardKey)}
        ariaLabel="Course board"
        style={{ margin: '0 -14px 12px', padding: '0 14px' }}
      />

      {courses.isPending ? (
        /* A held height, so the blocks below do not jump when rows arrive. */
        <div style={{ height: 200 }} aria-hidden />
      ) : rows.length === 0 ? (
        <div style={{ padding: '18px 2px' }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: DISCOVER_FACT }}>
            {t('discover.coursesPlayed.emptyLine', 'No courses played for {{line}}.', {
              line: appliedParts.join(' \u00B7 '),
            })}
          </p>
          {!filtersAreDefault(filters) && (
            <button
              type="button"
              onClick={state.resetFilters}
              style={{
                ...KICKER,
                marginTop: 10,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: A.INK,
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              {t('discover.filterBoard.reset', 'Clear the filter')}
            </button>
          )}
        </div>
      ) : (
        <>
          <CourseBoardRows
            rows={rows}
            board={courseBoard}
            onCoursePress={(courseId) => {
              analyticsEvents.track('amateur_course_row_tapped', { board: courseBoard, courseId });
              onCoursePress(courseId);
            }}
          />
          {total > rows.length && (
            <ListTerminalRow
              label={t('discover.filterBoard.seeAll', 'See all {{unit}}', { unit })}
              onPress={() => {
                analyticsEvents.track('amateur_courses_see_all_opened', { board: courseBoard, total });
                setSeeAll(true);
              }}
            />
          )}
        </>
      )}

      <CoursesPlayedSeeAllSheet
        open={seeAll}
        onClose={() => setSeeAll(false)}
        userId={userId}
        filters={filters}
        appliedParts={appliedParts}
        board={courseBoard}
        onBoardChange={state.changeCourseBoard}
        onCoursePress={(courseId) => {
          analyticsEvents.track('amateur_course_row_tapped', {
            board: courseBoard,
            courseId,
            from: 'see_all',
          });
          onCoursePress(courseId);
        }}
      />
    </section>
  );
}
