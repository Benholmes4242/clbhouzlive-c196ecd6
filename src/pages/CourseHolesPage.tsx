/**
 * BRIEF_COURSE_TAB_REBUILD §3.10 — THE DRILL-DOWN, "All 18 holes".
 *
 * ONE destination carrying the three analyses that used to have their own cards
 * on the Course tab: hole by hole, how each par plays, and stroke index against
 * how it plays WITH its explainer paragraph.
 *
 * NOTHING IS DELETED. CourseAnalyticsPanels, SiLadder and buildSiLadder are the
 * same components, rendered here instead of on the tab.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { CHROME_CLEARANCE } from '@/lib/chromeClearance';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { CourseAnalyticsPanels } from '@/features/courses/components/holes/analytical/CourseAnalyticsPanels';
import { SiLadder } from '@/features/courses/_shared/SiLadder';
import { buildSiLadder } from '@/features/courses/_shared/siLadder';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';

const CourseHolesPage: React.FC = () => {
  const { t } = useTranslation('courses');
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data } = useCourseHoleAnalysis(courseId);

  const ladder = React.useMemo(
    () => buildSiLadder(data?.holes ?? [], data?.total_rounds),
    [data?.holes, data?.total_rounds],
  );

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: A.CANVAS,
        fontFamily: SANS,
        paddingTop: CHROME_CLEARANCE,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      <div style={{ padding: '0 20px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back', { defaultValue: 'Back' })}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            color: A.MUTE,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
          {t('courseDetail.plays.allHolesTitle')}
        </h1>
      </div>

      {courseId ? (
        <>
          <CourseAnalyticsPanels courseId={courseId} explainEmpty />
          {ladder ? (
            <div style={{ padding: '12px 16px 0' }}>
              <SiLadder ladder={ladder} voice="course" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default CourseHolesPage;
