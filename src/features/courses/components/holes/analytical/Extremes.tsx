/**
 * The hardest and easiest hole - COURSE FACTS from get_course_hole_analysis
 * (everyone), the same hole for every reader (FIELD_EXCLUDES_VIEWER_C S1).
 * Shared by the Explore course hole panel and the Explore course panels; it
 * sits with the course-facts block, never on a you-against-the-field chart (S2).
 *
 * FIELD_EXCLUDES_VIEWER_D T1: WHICH hole is hardest/easiest is a course fact
 * (inclusive), but the small "Field avg" FIGURE under it is read from
 * `fieldHoles` - the same reader-excluded rows the panel's hole rows use - so
 * one hole never shows two "Field avg" figures from different populations.
 * A hole with no field once the reader is removed is blank; it never falls
 * back to the inclusive figure.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { A, toParParts } from './tokens';

const CAP: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: A.DIM,
};

export function Extremes({
  hardest,
  easiest,
  fieldHoles,
}: {
  hardest: CourseHole;
  easiest: CourseHole;
  fieldHoles: CourseHole[];
}) {
  const { t } = useTranslation('courses');
  const fieldFor = (h: CourseHole) => fieldHoles.find((f) => f.hole_no === h.hole_no)?.avg_to_par;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 10 }}>
      {/* §2.2 - the hardest hole's FIGURE obeys the to-par law like every
          other figure; the difficulty ramp lives in the BARS, not here. */}
      <Extreme label={t('discover.coursesPlayed.hardest', 'Hardest')} hole={hardest} fieldAvg={fieldFor(hardest)} />
      <Extreme label={t('discover.coursesPlayed.easiest', 'Easiest')} hole={easiest} fieldAvg={fieldFor(easiest)} />
    </div>
  );
}

function Extreme({ label, hole, fieldAvg, tone }: { label: string; hole: CourseHole; fieldAvg: number | undefined; tone?: string }) {
  const { t } = useTranslation('courses');
  const fig = toParParts(fieldAvg);
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={CAP}>{label}</div>
      <div
        style={{
          marginTop: 3,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          className="tabular-nums"
          style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.025em', color: A.INK, lineHeight: 1 }}
        >
          {hole.hole_no}
        </span>
        {fig && (
          <span style={{ textAlign: 'left' }}>
            <span
              className="tabular-nums"
              style={{ display: 'block', fontSize: 12, fontWeight: 700, color: tone ?? fig.tone, lineHeight: 1.1 }}
            >
              {fig.text}
            </span>
            <span style={{ ...CAP, display: 'block', fontSize: 8.5 }}>
              {t('courseDetail.plays.fieldAvg', 'Field avg')}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
