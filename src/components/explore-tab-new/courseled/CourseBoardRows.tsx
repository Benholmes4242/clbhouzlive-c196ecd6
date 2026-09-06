import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { r } from '@/lib/radius';
import { CourseImageFallback } from './CourseImageFallback';
import { PlaysTo } from './CoursesPlayedSection';
import { FIGS, SANS, PODIUM_ACCENT } from './tokens';
import type { BoardCourseRow } from './hooks/useBoardCourses';
import type { CourseBoardKey } from './boardFilters';

/**
 * BRIEF_SCORES_TWO_HALVES S5 — THE COURSE HALF IS A BOARD, SO IT IS A ROW.
 *
 * The four member columns have a course twin: position, subject, the board's own
 * figure, and the constant figure that lets any two rows be compared. Nothing
 * here re-sorts: public.get_board_courses ordered and limited on the same axis
 * (p_sort), and these rows render that order as given.
 *
 * THE TREND IS NEVER RED. Red means UNDER PAR on this page; a red fall beside a
 * red minus would make one colour mean two opposite things on one screen.
 */

const ROW_H = 60;
const RANK_W = 16;
const THUMB = 42;
const FIG_W = 58;

const CAP: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

export interface CourseBoardRowsProps {
  rows: BoardCourseRow[];
  board: CourseBoardKey;
  selectedId: string | null;
  onSelect: (courseId: string) => void;
}

/** The board's own figure, per axis. Null renders an em dash, never a blank. */
function BoardFigure({ row, board }: { row: BoardCourseRow; board: CourseBoardKey }) {
  if (board === 'hardest' || board === 'easiest') {
    return <PlaysTo value={row.plays_to} width={FIG_W} fontSize={15} weight={700} />;
  }
  if (board === 'low') {
    return (
      <span style={{ width: FIG_W, flexShrink: 0, textAlign: 'right' }}>
        <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: row.low_gross == null ? A.DIM : A.INK, lineHeight: 1 }}>
          {row.low_gross ?? '\u2014'}
        </span>
      </span>
    );
  }
  if (board === 'rated') {
    return (
      <span style={{ width: FIG_W, flexShrink: 0, textAlign: 'right' }}>
        <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: row.rating == null ? A.DIM : A.INK, lineHeight: 1 }}>
          {row.rating == null ? '\u2014' : row.rating.toFixed(1)}
        </span>
      </span>
    );
  }
  return (
    <span style={{ width: FIG_W, flexShrink: 0, textAlign: 'right' }}>
      <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: A.INK, lineHeight: 1 }}>
        {row.rounds}
      </span>
    </span>
  );
}

function Trend({ row }: { row: BoardCourseRow }) {
  if (row.is_new) {
    return (
      <span style={{ ...CAP, fontSize: 9, color: A.INK, border: `1px solid ${A.BORDER}`, borderRadius: 4, padding: '1px 5px' }}>
        NEW
      </span>
    );
  }
  if (row.prev_rounds == null) return null;
  const change = row.rounds - row.prev_rounds;
  if (change === 0) return null;
  const up = change > 0;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: up ? PODIUM_ACCENT.green : A.DIM, fontSize: 10.5, fontWeight: 700 }}>
      <Arrow size={10} aria-hidden />
      <span className="tabular-nums">{Math.abs(change)}</span>
    </span>
  );
}

export function CourseBoardHeaderRow({ board }: { board: CourseBoardKey }) {
  const figure =
    board === 'hardest' || board === 'easiest'
      ? 'PLAYS TO'
      : board === 'low'
        ? 'LOW'
        : board === 'rated'
          ? 'RATED'
          : 'ROUNDS';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 0 7px',
        borderBottom: `1px solid ${A.HAIRLINE}`,
        fontFamily: SANS,
        ...FIGS,
      }}
    >
      <span style={{ ...CAP, width: RANK_W, flexShrink: 0, color: A.DIM }}>#</span>
      <span style={{ ...CAP, flex: 1, minWidth: 0, color: A.DIM }}>COURSE</span>
      <span style={{ ...CAP, width: FIG_W, flexShrink: 0, textAlign: 'right', color: A.DIM }}>{figure}</span>
    </div>
  );
}

export function CourseBoardRows({ rows, board, selectedId, onSelect }: CourseBoardRowsProps) {
  const { t } = useTranslation('courses');
  return (
    <>
      {rows.map((row, index) => {
        const selected = row.course_id === selectedId;
        return (
          <button
            key={row.course_id}
            type="button"
            onClick={() => onSelect(row.course_id)}
            aria-pressed={selected}
            style={{
              width: '100%',
              minHeight: ROW_H,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${A.HAIRLINE}`,
              fontFamily: SANS,
              textAlign: 'left',
              cursor: 'pointer',
              ...FIGS,
            }}
          >
            <span
              className="tabular-nums"
              style={{ width: RANK_W, flexShrink: 0, fontSize: 12, fontWeight: 700, color: selected ? A.INK : A.DIM }}
            >
              {index + 1}
            </span>
            <span style={{ width: THUMB, height: THUMB, flexShrink: 0, borderRadius: r.sm, overflow: 'hidden', position: 'relative' }}>
              <CourseImageFallback
                courseId={row.course_id}
                courseName={row.name}
                imageUrl={row.thumbnail_image}
                initialsSize={13}
                style={{ position: 'absolute', inset: 0 }}
              />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: A.INK,
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.name ?? '\u2014'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, minWidth: 0 }}>
                <span style={{ ...CAP, color: A.MUTE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[row.area, t('discover.coursesPlayed.nMembers', '{{count}} members', { count: row.members })]
                    .filter(Boolean)
                    .join(' \u00B7 ')}
                </span>
                <Trend row={row} />
              </span>
            </span>
            <BoardFigure row={row} board={board} />
          </button>
        );
      })}
    </>
  );
}

export default CourseBoardRows;
