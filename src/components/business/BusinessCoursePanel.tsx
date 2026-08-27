/**
 * BusinessCoursePanel - one analytical panel per course belonging to the
 * business's club (BRIEF_BUSINESS_PROFILE_PAGE A3).
 *
 * One component instance per course so `useCourseStatsDetail` stays a single
 * hook call per course. The query cache is shared with the page-level call
 * used by the reach row, so a single-course club issues ONE request.
 *
 * Rules encoded here:
 *   - the PLAYS TO figure is omitted when `avg_over_par` is null (a missing
 *     course par must never render as a green "easier than 100%")
 *   - the figure tone AND its percentile sentence both derive from
 *     `harder_than_pct`, so the numeral and the words can never disagree
 *   - every cell self-hides on a null value; no placeholder dashes
 *   - `rounds_tracked === 0` renders name, location and the Action only
 */
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  A, Panel, Action, LABEL, NUM, CAPTION, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useTop100Config } from '@/hooks/top100/useTop100Config';

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
  sub?: string;
  subTone?: string;
}

interface BusinessCoursePanelProps {
  course: BusinessClubCourse;
  /** First panel carries the section kicker; the rest are name-only. */
  isFirst: boolean;
  /** Plural heading when the club has more than one course. */
  plural: boolean;
  position: number;
  onOpen: (courseId: string, position: number) => void;
  /** Reports whether this panel managed to render any figures. */
  onFiguresResolved?: (courseId: string, hasFigures: boolean) => void;
}

export const BusinessCoursePanel: React.FC<BusinessCoursePanelProps> = ({
  course,
  isFirst,
  plural,
  position,
  onOpen,
  onFiguresResolved,
}) => {
  const { t } = useTranslation();
  const cfg = useTop100Config();
  const { data: stats } = useCourseStatsDetail(course.id, true);

  const rounds = stats?.rounds_tracked ?? 0;
  const pct = stats?.harder_than_pct ?? null;

  const cells: Cell[] = [];

  if (rounds > 0) {
    const toPar = toParParts(stats?.avg_over_par, 1);
    if (toPar) {
      let tone = toPar.tone;
      let sub: string | undefined;
      if (pct != null) {
        if (pct >= cfg.bandHigh) {
          tone = A.RED;
          sub = t('business.course.harderThan', { pct: Math.round(pct) });
        } else if (pct <= cfg.bandLow) {
          tone = A.GREEN;
          sub = t('business.course.easierThan', { pct: Math.round(100 - pct) });
        } else {
          tone = A.INK;
          sub = t('business.course.middleOfPack');
        }
      }
      cells.push({
        label: t('business.course.playsTo'),
        value: toPar.text,
        tone,
        sub,
        subTone: tone,
      });
    }

    if (stats?.hardest_hole_no != null) {
      cells.push({
        label: t('business.course.hardest'),
        value: String(stats.hardest_hole_no),
        sub: stats.hardest_hole_par != null
          ? t('business.course.parN', { n: stats.hardest_hole_par })
          : undefined,
      });
    }

    if (stats?.top100_rank != null) {
      cells.push({
        label: t('business.course.rankOn', {
          list: (stats.top100_list || '').toUpperCase() || 'TOP 100',
        }),
        value: `#${stats.top100_rank}`,
      });
    }
  }

  const hardestToPar = rounds > 0 ? toParParts(stats?.hardest_hole_plays, 1) : null;
  const footLine = hardestToPar
    ? t('business.course.footHardest', { toPar: hardestToPar.text })
    : null;

  const reportedRef = useRef<boolean>(false);
  const hasFigures = cells.length > 0;
  useEffect(() => {
    if (reportedRef.current || !stats) return;
    reportedRef.current = true;
    onFiguresResolved?.(course.id, hasFigures);
  }, [stats, hasFigures, course.id, onFiguresResolved]);

  const meta = [course.region, course.country].filter(Boolean).join(', ');

  return (
    <Panel
      kicker={
        isFirst
          ? (plural ? t('business.course.kickerPlural') : t('business.course.kicker'))
          : undefined
      }
      aside={rounds > 0 ? t('business.course.fromRounds', { count: rounds }) : undefined}
      style={{ marginTop: 12 }}
    >
      <p style={{ fontSize: 15, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em', margin: 0 }}>
        {course.name}
      </p>
      {meta && <p style={{ ...CAPTION, marginTop: 4 }}>{meta}</p>}

      {hasFigures && (
        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
          }}
        >
          {cells.map((c) => (
            <div key={c.label} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={LABEL}>{c.label}</div>
              <div style={{ ...NUM, fontSize: 22, color: c.tone ?? A.INK, marginTop: 4, whiteSpace: 'nowrap' }}>
                {c.value}
              </div>
              {c.sub && (
                <div
                  style={{
                    ...LABEL,
                    marginTop: 3,
                    color: c.subTone ?? A.DIM,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {footLine && <p style={{ ...CAPTION, marginTop: 12 }}>{footLine}</p>}

      <Action
        label={t('business.course.open')}
        align="left"
        onClick={() => onOpen(course.id, position)}
        style={{ marginTop: 12 }}
      />
    </Panel>
  );
};

export default BusinessCoursePanel;
