/**
 * BusinessCourseRow - one ROW per course inside the business profile's single
 * courses panel (BRIEF_BUSINESS_COURSE_ROWS).
 *
 * One component instance per course so `useCourseStatsDetail` stays a single
 * hook call per course. The parent owns the one <Panel>; this renders a row.
 *
 * Rules encoded here:
 *   - PLAYS TO is omitted when `avg_over_par` is null, and takes toParParts'
 *     own tone. No difficulty-percentile colour branch: the to-par red is for
 *     under par only.
 *   - HARDEST is the hole ordinal only; its par and plays-over figure live on
 *     the course page.
 *   - a Top 100 rank joins the place line, never a cell
 *   - every cell self-hides on a null value; no placeholder dashes
 *   - `rounds_tracked === 0` renders the name and place lines only
 *   - the whole row is the tap target
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  A, BIZ_LABEL, FIGS, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { ordinal } from '@/components/courses/course-detail/you/youBits';

export interface BusinessClubCourse {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
}

interface Cell {
  label: string;
  value: string;
  tone?: string;
}

interface BusinessCoursePanelProps {
  course: BusinessClubCourse;
  /** First row takes no top rule or top padding. */
  isFirst: boolean;
  position: number;
  onOpen: (courseId: string, position: number) => void;
  /** Reports once when the stats read resolves: figures present + rounds tracked. */
  onFiguresResolved?: (courseId: string, hasFigures: boolean, rounds: number) => void;
}

export const BusinessCoursePanel: React.FC<BusinessCoursePanelProps> = ({
  course,
  isFirst,
  position,
  onOpen,
  onFiguresResolved,
}) => {
  const { t } = useTranslation();
  const { data: stats } = useCourseStatsDetail(course.id, true);

  const rounds = stats?.rounds_tracked ?? 0;
  const cells: Cell[] = [];

  if (rounds > 0) {
    const toPar = toParParts(stats?.avg_over_par, 1);
    if (toPar) {
      cells.push({ label: t('business.course.playsTo'), value: toPar.text, tone: toPar.tone });
    }
    if (stats?.hardest_hole_no != null) {
      cells.push({ label: t('business.course.hardest'), value: ordinal(stats.hardest_hole_no) });
    }
    cells.push({ label: t('business.course.roundsLabel'), value: rounds.toLocaleString() });
  }

  const reportedRef = useRef<boolean>(false);
  const hasFigures = cells.length > 0;
  useEffect(() => {
    if (reportedRef.current || !stats) return;
    reportedRef.current = true;
    onFiguresResolved?.(course.id, hasFigures, rounds);
  }, [stats, hasFigures, rounds, course.id, onFiguresResolved]);

  const meta = [course.region, course.country].filter(Boolean).join(', ');
  const rank = stats?.top100_rank != null
    ? `#${stats.top100_rank} ${(stats.top100_list || '').toUpperCase() || 'TOP 100'}`
    : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(course.id, position)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 0,
        borderTop: isFirst ? 0 : `1px solid ${A.SOFT}`,
        padding: isFirst ? 0 : '14px 0 0',
        paddingBottom: 14,
        margin: 0,
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer',
      }}
      className="last:!pb-0"
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
          {course.name}
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: A.DIM }}>›</span>
      </div>
      {(meta || rank) && (
        <p style={{ marginTop: 4, marginBottom: 0, fontSize: 11.5, lineHeight: 1.4, color: A.DIM }}>
          {meta}
          {rank && (
            <span style={{ color: A.MUTE, fontWeight: 700 }}>{meta ? ` · ${rank}` : rank}</span>
          )}
        </p>
      )}

      {hasFigures && (
        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
            gap: 10,
          }}
        >
          {cells.map((c) => (
            <div key={c.label} style={{ minWidth: 0 }}>
              <div style={{ ...BIZ_LABEL, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.label}
              </div>
              <div
                style={{
                  marginTop: 5,
                  fontSize: 18,
                  fontWeight: 700,
                  color: c.tone ?? A.INK,
                  whiteSpace: 'nowrap',
                  ...FIGS,
                }}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
};

export default BusinessCoursePanel;
