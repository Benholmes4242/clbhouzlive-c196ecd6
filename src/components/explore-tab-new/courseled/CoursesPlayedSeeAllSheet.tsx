import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { FIGS, SANS } from './tokens';
import type { BoardFilters } from './boardFilters';
import { useBoardCourses } from './hooks/useBoardCourses';
import { CourseHeaderRow, CourseRow } from './CoursesPlayedSection';

/**
 * COURSES PLAYED — SEE ALL (BRIEF_DISCOVER_STICKY_FILTER_BAR G5).
 *
 * THE SAME CALL, A RAISED LIMIT. get_board_courses is asked the same question
 * with the same applied filter state and no board key, so the sheet can never
 * disagree with the six rows behind it about which courses were played.
 *
 * IT IS THE BOARD'S SEE-ALL SHEET'S TWIN, NOT ITS REUSE (G5.2): A.CANVAS
 * surface, uppercase name left, Done right, a subject block giving the count and
 * the applied window, then rows. BoardSeeAllSheet pages a RANKED member board
 * with POS columns; these rows are expandable course rows. Same anatomy, a
 * different subject — so the anatomy is matched, deliberately, rather than
 * forcing one component to be two things.
 */

const SHEET_LIMIT = 300;

export interface CoursesPlayedSeeAllSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  filters: BoardFilters;
  /** The applied WINDOW only, exactly as the section header states it. */
  windowLabel: string;
  onCoursePress?: (courseId: string) => void;
  onMemberPress?: (userId: string) => void;
}

export function CoursesPlayedSeeAllSheet({
  open,
  onClose,
  userId,
  filters,
  windowLabel,
  onCoursePress,
}: CoursesPlayedSeeAllSheetProps) {
  const { t } = useTranslation('courses');
  /* One row open at a time, exactly as in the section. */
  const [openId, setOpenId] = useState<string | null>(null);

  const courses = useBoardCourses(userId, filters, { limit: SHEET_LIMIT, enabled: open });
  const rows = courses.data?.rows ?? [];
  const total = courses.data?.total ?? 0;
  /* The scale bar reads against the range of the rows THIS surface shows. */
  const playsTo = rows.map((r) => r.plays_to).filter((v): v is number => v != null);
  const scaleMax = playsTo.length > 0 ? Math.max(...playsTo) : 0;
  const scaleMin = playsTo.length > 0 ? Math.min(...playsTo) : 0;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="dark"
      surfaceColor={A.CANVAS}
      maxHeight="85dvh"
      ariaLabelledBy="courses-see-all-title"
      style={{ height: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
    >
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 16px 12px',
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <h2 id="courses-see-all-title" style={{ ...KICKER, margin: 0, color: A.INK }}>
          {t('discover.coursesPlayed.title', 'Courses played')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{ ...KICKER, padding: '8px 0', background: 'transparent', border: 'none', fontFamily: SANS, color: A.INK, cursor: 'pointer' }}
        >
          {t('discover.filterBoard.done', 'Done')}
        </button>
      </div>

      <div style={{ flexShrink: 0, padding: '16px 16px 12px', borderBottom: `1px solid ${A.BORDER}`, fontFamily: SANS, ...FIGS }}>
        <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: A.INK, textTransform: 'uppercase' }}>
          {t('discover.coursesPlayed.nCourses', '{{count}} courses', { count: total })}
        </div>
        <div style={{ ...KICKER, marginTop: 6, color: A.MUTE }}>{windowLabel}</div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          willChange: 'transform',
          padding: '0 16px calc(env(safe-area-inset-bottom, 0px) + 24px)',
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        <CourseHeaderRow />
        {rows.map((row, index) => (
          <CourseRow
            key={row.course_id}
            row={row}
            rank={index + 1}
            first={index === 0}
            open={openId === row.course_id}
            onToggle={() => setOpenId((cur) => (cur === row.course_id ? null : row.course_id))}
            userId={userId}
            filters={filters}
            scaleMin={scaleMin}
            scaleMax={scaleMax}
            onCoursePress={onCoursePress}
          />
        ))}
      </div>
    </BottomSheet>
  );
}

export default CoursesPlayedSeeAllSheet;
