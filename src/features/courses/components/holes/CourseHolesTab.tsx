import React, { useMemo, useState } from 'react';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { HolesCredibilityHeader } from './HolesCredibilityHeader';
import { HoleFeatureCards } from './HoleFeatureCards';
import { HoleRow } from './HoleRow';

import { HolesEmptyState } from './HolesEmptyState';
import { FONT, INK, SC_ACCENT } from './_constants';
import { HAIRLINE_INK_8, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';

interface Props {
  courseId: string | undefined;
}

export const CourseHolesTab: React.FC<Props> = ({ courseId }) => {
  const { data, isLoading, isError } = useCourseHoleAnalysis(courseId);
  const { data: meta } = useCourseMeta(courseId);
  const [sort, setSort] = useState<'hole' | 'difficulty'>('hole');

  const holes = data?.holes ?? [];

  const sorted = useMemo(() => {
    if (sort === 'difficulty') return [...holes].sort((a, b) => b.avg_to_par - a.avg_to_par);
    return [...holes].sort((a, b) => a.hole_no - b.hole_no);
  }, [holes, sort]);

  const hardest = useMemo(
    () => holes.reduce<CourseHole | null>((m, h) => (!m || h.avg_to_par > m.avg_to_par ? h : m), null),
    [holes],
  );
  const easiest = useMemo(
    () => holes.reduce<CourseHole | null>((m, h) => (!m || h.avg_to_par < m.avg_to_par ? h : m), null),
    [holes],
  );
  const maxAvg = useMemo(() => Math.max(0.01, ...holes.map((h) => h.avg_to_par)), [holes]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 88,
              borderRadius: 12,
              background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
              backgroundSize: '200% 100%',
              animation: 'holesShimmer 1.4s linear infinite',
            }}
          />
        ))}
        <style>{`@keyframes holesShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '40px 18px', textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: INK_MUTE }}>
          Couldn't load hole analysis.
        </div>
      </div>
    );
  }

  if (!data?.available || holes.length === 0) {
    return (
      <>
        <ConnectHandicapCue variant="holes" courseName={meta?.course_name ?? ''} />
        <HolesEmptyState courseName={meta?.course_name ?? null} />
      </>
    );
  }

  return (
    <div style={{ background: '#F8FAFC', fontFamily: FONT }}>
      <ConnectHandicapCue variant="holes" courseName={meta?.course_name ?? ''} />
      <HolesCredibilityHeader totalRounds={data.total_rounds} />
      {hardest && easiest && hardest.hole_no !== easiest.hole_no && (
        <HoleFeatureCards hardest={hardest} easiest={easiest} />
      )}
      <div
        style={{
          padding: '4px 18px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: SC_ACCENT,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          All holes
        </div>
        <div
          style={{
            display: 'inline-flex',
            gap: 2,
            background: '#F1F5F9',
            border: `1px solid ${HAIRLINE_INK_8}`,
            borderRadius: 999,
            padding: 3,
          }}
        >
          {([['hole', 'By hole'], ['difficulty', 'By difficulty']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                border: 'none',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: sort === k ? INK : 'transparent',
                color: sort === k ? SURFACE : INK_MUTE,
                fontFamily: FONT,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {sorted.map((h) => (
        <HoleRow
          key={h.hole_no}
          h={h}
          maxAvg={maxAvg}
          isHardest={h.hole_no === hardest?.hole_no}
          isEasiest={h.hole_no === easiest?.hole_no}
        />
      ))}
      
    </div>
  );
};

export default CourseHolesTab;
