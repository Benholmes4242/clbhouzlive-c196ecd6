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
import { HoleDataSheet, type HoleDataSection } from './HoleDataSheet';
import { CourseTeeCard } from './CourseTeeCard';

interface Props {
  courseId: string | undefined;
  /** Which slice of HoleDataSheet to render. Default 'all' (legacy tab). */
  section?: HoleDataSection;
  /** Render the tee card above the sheet. Default true (legacy tab). */
  showTeeCard?: boolean;
  /** Render the connect-handicap ghost prompt. Default true (legacy tab). */
  showGhost?: boolean;
  /** Render the "no hole data" empty state. Default true (legacy tab). */
  showEmptyState?: boolean;
  /**
   * Suppress the loading and error branches. Used by the second mount on the
   * Course tab so a single shimmer / single Retry panel is shown, owned by the
   * 'shape' mount above it. React Query dedupes the fetch either way.
   */
  suppressStatus?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onExpand?: () => void;
}

export const CourseHolesTab: React.FC<Props> = ({
  courseId,
  section = 'all',
  showTeeCard = true,
  showGhost = true,
  showEmptyState = true,
  suppressStatus = false,
  collapsible = false,
  defaultCollapsed = false,
  onExpand,
}) => {

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
    if (suppressStatus) return null;
    return (

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 88,
              borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.05) 100%)',
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
    if (suppressStatus) return null;
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

  const wantsGhost = showGhost && Boolean(user) && !connection;
  const ghost = wantsGhost ? (
    <ConnectGhostPrompt
      surface="holes"
      onConnect={() => navigate('/handicap')}
    />
  ) : null;

  const teeCard = showTeeCard ? <CourseTeeCard courseId={courseId} /> : null;

  if (!data?.available || holes.length === 0) {
    return (
      <>
        {ghost}
        {teeCard}
        {showEmptyState && <HolesEmptyState courseName={meta?.course_name ?? null} />}
      </>
    );
  }

  return (
    <>
      {ghost}
      {teeCard}
      <HoleDataSheet
        courseName={meta?.course_name ?? ''}
        courseId={courseId}
        holes={holes}
        totalRounds={data.total_rounds}
        myByHole={myByHole}
        viewerHasPlayed={viewerHasPlayed}
        section={section}
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        onExpand={onExpand}
      />
    </>
  );
};


export default CourseHolesTab;
