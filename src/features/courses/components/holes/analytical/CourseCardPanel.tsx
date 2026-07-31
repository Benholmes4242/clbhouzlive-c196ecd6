/**
 * CourseCardPanel - Block 1 of the analytical Course tab.
 *
 * Summary panel: PAR / CR / SLOPE stay on the page; the tee selector and the
 * 18-row scorecard move behind a 75dvh sheet that renders the EXISTING
 * CourseTeeCard (hideHeader) so there is one scorecard implementation.
 *
 * Tee agreement: the panel resolves the selected tee from the same
 * per-course localStorage persistence CourseTeeCard writes to, and re-reads it
 * when the sheet closes, so the two can never disagree.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useProfileData } from '@/hooks/useProfileData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatNumber } from '@/i18n/format';
import { useCourseTeeSets, type TeeSet } from '../../../hooks/useCourseTeeSets';
import { CourseTeeCard, resolveDefaultTee } from '../CourseTeeCard';
import { A, KICKER, Panel, StatRow } from './tokens';

interface Props {
  courseId: string | undefined;
}

export const CourseCardPanel: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation(['courses']);
  const { profile } = useProfileData();
  const { data } = useCourseTeeSets(courseId);
  const tees = useMemo<TeeSet[]>(() => data ?? [], [data]);

  const [open, setOpen] = useState(false);
  // Bumped when the sheet closes so the resolved tee is re-read from storage.
  const [readToken, setReadToken] = useState(0);

  const active = useMemo<TeeSet | null>(() => {
    if (!courseId || tees.length === 0) return null;
    const label = resolveDefaultTee(tees, courseId, profile?.gender ?? null);
    return tees.find((x) => x.tee_label === label) ?? tees[0];
    // readToken is a deliberate re-read trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, tees, profile?.gender, readToken]);

  if (!courseId || !active) return null;

  const openSheet = () => {
    analyticsEvents.track('course_card_sheet_opened', { course_id: courseId });
    setOpen(true);
  };
  const closeSheet = () => {
    setOpen(false);
    setReadToken((n) => n + 1);
  };

  const yards = active.total_yards ?? null;

  return (
    <>
      <Panel
        kicker={t('courses:teeCard.eyebrow')}
        aside={
          yards != null
            ? `${active.tee_label} \u00B7 ${t('courses:courseDetail.card.yards', {
                count: Math.round(yards),
                yards: formatNumber(Math.round(yards)),
              })}`
            : active.tee_label
        }
        footer={t('courses:courseDetail.card.seeFull')}
        onOpen={openSheet}
        style={{ margin: '0 16px' }}
      >
        <StatRow
          items={[
            { label: t('courses:teeCard.stat.par'), value: active.par_total },
            ...(Number.isFinite(active.course_rating)
              ? [{ label: t('courses:teeCard.stat.cr'), value: active.course_rating.toFixed(1) }]
              : []),
            ...(active.slope_rating != null
              ? [{ label: t('courses:teeCard.stat.slope'), value: Math.round(active.slope_rating) }]
              : []),
          ]}
        />
      </Panel>

      <BottomSheet
        open={open}
        onClose={closeSheet}
        variant="light"
        maxHeight="75dvh"
        ariaLabelledBy="course-card-sheet-title"
        style={{
          height: '75dvh',
          maxHeight: '75dvh',
          display: 'flex',
          flexDirection: 'column',
          background: A.PANEL,
        }}
      >
        <div style={{ padding: '0 16px 8px' }}>
          <div style={KICKER}>{t('courses:teeCard.eyebrow')}</div>
          <h2
            id="course-card-sheet-title"
            style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: A.INK }}
          >
            {t('courses:courseDetail.card.sheetTitle', { tee: active.tee_label })}
          </h2>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <CourseTeeCard courseId={courseId} hideHeader />
        </div>
      </BottomSheet>
    </>
  );
};

export default CourseCardPanel;
