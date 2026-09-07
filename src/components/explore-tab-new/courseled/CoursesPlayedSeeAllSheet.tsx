import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
import { RailChips } from '@/components/ui/RailChips';
import { FIGS, SANS } from './tokens';
import { COURSE_BOARD_KEYS, COURSE_BOARD_LABELS, type BoardFilters, type CourseBoardKey } from './boardFilters';
import { useBoardCourses } from './hooks/useBoardCourses';
import { CourseBoardRows } from './CourseBoardRows';
import { SectionHeadline } from './SectionHeadline';

/**
 * COURSES — SEE ALL (BRIEF_SCORES_COURSE_ROWS_AND_SEE_ALL_SHEET S2).
 *
 * THE SECTION AT FULL LENGTH, NOT A SECOND DESIGN. It opens on the board that
 * was on screen, states that board's name and count in the section's own
 * headline treatment, carries the section's chip rail so the board can be
 * switched without dismissing, and renders CourseBoardRows — the SAME row
 * component the section uses. The accordion, the column headers, the bespoke
 * title and the field plays-to right-hand value are gone: every figure that
 * lived in the accordion already exists in COURSE ANALYTICS and on the course
 * page, so none of it is rebuilt here.
 */

const SHEET_LIMIT = 300;

export interface CoursesPlayedSeeAllSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  filters: BoardFilters;
  /** The page's own applied-filter parts — one formatter, page and sheet. */
  appliedParts: string[];
  /** The board on screen; the sheet opens on it and can change it. */
  board: CourseBoardKey;
  onBoardChange: (board: CourseBoardKey) => void;
  onCoursePress?: (courseId: string) => void;
  onMemberPress?: (userId: string) => void;
}

export function CoursesPlayedSeeAllSheet({
  open,
  onClose,
  userId,
  filters,
  appliedParts,
  board,
  onBoardChange,
  onCoursePress,
}: CoursesPlayedSeeAllSheetProps) {
  const { t } = useTranslation('courses');

  const courses = useBoardCourses(userId, filters, { limit: SHEET_LIMIT, sort: board, enabled: open });
  const rows = courses.data?.rows ?? [];
  const total = courses.data?.total ?? 0;

  const title = t(COURSE_BOARD_LABELS[board].i18n, COURSE_BOARD_LABELS[board].label);
  /* S3 — the same key and the same pre-limit total the section counts on. */
  const count = t('discover.coursesPlayed.nCourses', '{{count}} courses', { count: total });

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
      {/* S4b — ONE HORIZONTAL PADDING OWNER for every child of the sheet. */}
      <div style={{ flexShrink: 0, padding: '4px 16px 0', fontFamily: SANS, ...FIGS }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ ...KICKER, padding: '6px 0', background: 'transparent', border: 'none', fontFamily: SANS, color: A.INK, cursor: 'pointer' }}
          >
            {t('discover.filterBoard.done', 'Done')}
          </button>
        </div>
        <div id="courses-see-all-title">
          <SectionHeadline title={title} count={count} />
        </div>
        <div style={{ ...KICKER, marginTop: -4, marginBottom: 10, color: A.MUTE }}>
          {appliedParts.map((part, index) => (
            <span key={`${part}:${index}`}>{index > 0 ? <> {'\u00B7'} </> : null}{part}</span>
          ))}
        </div>
        <RailChips
          options={COURSE_BOARD_KEYS.map((key) => ({
            id: key,
            label: t(COURSE_BOARD_LABELS[key].i18n, COURSE_BOARD_LABELS[key].label),
          }))}
          value={board}
          onChange={(next) => onBoardChange(next as CourseBoardKey)}
          ariaLabel="Board"
          style={{ margin: '0 -16px 12px', padding: '0 16px' }}
        />
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
        <CourseBoardRows rows={rows} board={board} onCoursePress={onCoursePress} />
      </div>
    </BottomSheet>
  );
}

export default CoursesPlayedSeeAllSheet;
