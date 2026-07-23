import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { HolesEmptyState } from './HolesEmptyState';
import { FONT } from './_constants';
import { INK_MUTE } from '@/features/courses/_shared/tokens';
import ConnectGhostPrompt from '@/components/handicap/ConnectGhostPrompt';
import { HolesGhost } from '@/components/handicap/ConnectGhostPreviews';
import { HoleDataSheet } from './HoleDataSheet';

interface Props {
  courseId: string | undefined;
}

export const CourseHolesTab: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation(['courses']);
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useCourseHoleAnalysis(courseId);
  const { data: meta } = useCourseMeta(courseId);
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data: myPerf } = useMyHolePerformance(user?.id, courseId, {
    enabled: Boolean(user?.id && courseId && connection),
  });

  const holes = data?.holes ?? [];

  const myByHole = useMemo(() => {
    const map = new Map<number, MyHolePerformanceRow>();
    (myPerf ?? []).forEach((row) => map.set(row.hole_no, row));
    return map;
  }, [myPerf]);

  const viewerHasPlayed = Boolean(user && connection && myPerf && myPerf.length > 0);

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
          style={{
            border: 0,
            borderRadius: 999,
            background: '#f59e0b',
            color: '#fff',
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          {t('courses:holes.retry')}
        </button>
      </div>
    );
  }

  const showGhost = Boolean(user) && !connection;
  const ghost = showGhost ? (
    <ConnectGhostPrompt
      surface="holes"
      ghost={<HolesGhost />}
      onConnect={() => navigate('/handicap')}
    />
  ) : null;

  if (!data?.available || holes.length === 0) {
    return (
      <>
        {ghost}
        <HolesEmptyState courseName={meta?.course_name ?? null} />
      </>
    );
  }

  return (
    <>
      {ghost}
      <HoleDataSheet
        courseName={meta?.course_name ?? ''}
        courseId={courseId}
        holes={holes}
        totalRounds={data.total_rounds}
        myByHole={myByHole}
        viewerHasPlayed={viewerHasPlayed}
      />
    </>
  );
};

export default CourseHolesTab;
