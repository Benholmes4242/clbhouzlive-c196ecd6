import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { HolesCredibilityHeader } from './HolesCredibilityHeader';
import { HoleFeatureCards } from './HoleFeatureCards';
import { HolesEmptyState } from './HolesEmptyState';
import { FONT, INK, SC_ACCENT } from './_constants';
import { HAIRLINE_INK_8, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SharedHoleCard } from '@/features/courses/_shared/holes/SharedHoleCard';
import type { SharedHole } from '@/features/courses/_shared/holes/types';
import { ScopeSegment } from '@/components/shared/ScopeSegment';


interface Props {
  courseId: string | undefined;
}

function toShared(h: CourseHole): SharedHole {
  return {
    hole_no: h.hole_no,
    par: h.par,
    yards: h.yards,
    stroke_index: h.stroke_index,
    rounds: h.rounds,
    avg_to_par: h.avg_to_par,
    avg_gross: h.avg_gross,
    dist: h.dist,
  };
}

export const CourseHolesTab: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation(['courses']);
  const { data, isLoading, isError, refetch } = useCourseHoleAnalysis(courseId);
  const { data: meta } = useCourseMeta(courseId);
  const [sort, setSort] = useState<'hole' | 'difficulty'>('hole');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

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
  const maxAbs = useMemo(
    () => Math.max(0.01, ...holes.map((h) => Math.abs(h.avg_to_par))),
    [holes],
  );

  const toggle = (holeNo: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(holeNo)) next.delete(holeNo);
      else next.add(holeNo);
      return next;
    });

  if (isLoading) {
    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>
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
      <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: FONT }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: INK_MUTE, marginBottom: 16 }}>
          {t('courses:holes.errorLoading')}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-[#f59e0b] text-white text-sm font-semibold px-5 py-2 active:scale-[0.98] transition-all min-h-[44px] hover:bg-[#e8920f]"
        >
          {t('courses:holes.retry')}
        </button>
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
          padding: '0 16px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <SectionHeader
          role="section"
          kicker={t('courses:holes.allHolesKicker')}
          accent={SC_ACCENT}
          className="!mb-0"
        />
        <ScopeSegment
          value={sort}
          onChange={(next) => setSort(next as 'hole' | 'difficulty')}
          ariaLabel={t('courses:holes.sortAriaLabel', 'Sort holes')}
          options={[
            { value: 'hole', label: t('courses:holes.sortByHole') },
            { value: 'difficulty', label: t('courses:holes.sortByDifficulty') },
          ]}
        />


      </div>
      {sorted.map((h) => (
        <SharedHoleCard
          key={h.hole_no}
          hole={toShared(h)}
          maxAbs={maxAbs}
          countLabel={t('courses:holes.roundsLabel', 'rounds')}
          expanded={expanded.has(h.hole_no)}
          onToggle={() => toggle(h.hole_no)}
          tag={
            hardest && h.hole_no === hardest.hole_no
              ? 'hardest'
              : easiest && h.hole_no === easiest.hole_no
              ? 'easiest'
              : null
          }
        />
      ))}
    </div>
  );
};

export default CourseHolesTab;

