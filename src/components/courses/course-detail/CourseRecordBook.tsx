/**
 * CourseRecordBook - the Champions content promoted onto the Course tab.
 *
 * Analytical treatment (BRIEF_COURSE_TAB_LOWER_BLOCKS, Block 3a):
 *   - one Panel, no zebra bands, no tinted pills, no internal dividers
 *   - rows are a 26px / 1fr / 58px grid: avatar, label + name, value
 *   - colour means one thing: amber = the viewing member holds this record
 *   - the crown marks the course record row (lowest gross, all time) only
 *
 * Data comes from the existing useCourseLegends RPC via useCourseRecordSummary
 * - no new query is introduced.
 */
import React from 'react';
import { Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { legendCategoryLabel, formatLegendValueCompact } from '@/lib/gam/visuals';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseRecordSummary } from './useCourseRecordSummary';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A, LABEL, NUM, Panel, SANS } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  courseId: string;
  courseName: string;
  courseRegion?: string | null;
  courseCountry?: string | null;
  courseType?: string | null;
  /** Category to scroll to / highlight, forwarded from the ?cat= deep link. */
  initialCategory?: string | null;
  /** Opens the Champions tab - the record book no longer lives in a sheet. */
  onSeeAll?: () => void;
  /** Retained for API compatibility; the panel owns its own kicker. */
  hideHeader?: boolean;
}

export const CourseRecordBook: React.FC<Props> = ({
  courseId,
  courseName,
  initialCategory = null,
  onSeeAll,
}) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { isLoading, previewRows, unclaimedCount, hasAnyHolder } =
    useCourseRecordSummary(courseId, user?.id ?? null);

  const openBoards = React.useCallback(() => {
    analyticsEvents.track('course_record_book_opened', { course_id: courseId });
    onSeeAll?.();
  }, [courseId, onSeeAll]);

  // Deep-linked opens (?cat=) also count.
  const deepLinkFired = React.useRef(false);
  React.useEffect(() => {
    if (!initialCategory || deepLinkFired.current) return;
    deepLinkFired.current = true;
    analyticsEvents.track('course_record_book_opened', { course_id: courseId });
  }, [initialCategory, courseId]);

  if (isLoading) {
    return (
      <Panel kicker={t('courseDetail.records.kicker')}>
        <div style={{ display: 'grid', gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 26, borderRadius: 8, background: A.TRACK }} />
          ))}
        </div>
      </Panel>
    );
  }

  const footer =
    unclaimedCount > 0
      ? t('courseDetail.records.seeAllUnclaimed', { count: unclaimedCount })
      : t('courseDetail.records.seeAll');

  return (
    <Panel
      kicker={t('courseDetail.records.kicker')}
      footer={footer}
      onOpen={openBoards}
    >
      {hasAnyHolder ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {previewRows.map(({ category, row }) => {
            const isYou = !!user?.id && row.user_id === user.id;
            const tone = isYou ? A.AMBER_DEEP : A.INK;
            const isCourseRecord = category === 'lowest_gross_all_time';
            return (
              <button
                key={category}
                type="button"
                onClick={openBoards}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '26px 1fr 58px',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: SANS,
                }}
              >
                <SquircleAvatar
                  src={row.user_photo_url}
                  alt={row.user_display_name ?? 'Golfer'}
                  userId={row.user_id}
                  size={26}
                  thinRing
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isCourseRecord && <Crown size={10} color={A.AMBER} strokeWidth={2.6} />}
                    {legendCategoryLabel[category]}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isYou ? 800 : 700,
                      color: tone,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isYou
                      ? t('courseDetail.records.you')
                      : row.user_display_name ?? 'Golfer'}
                  </div>
                </div>
                <div style={{ ...NUM, fontSize: 15, color: tone, textAlign: 'right' }}>
                  {formatLegendValueCompact(category, row.value)}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: A.MUTE, lineHeight: 1.5 }}>
          {t('courseDetail.records.empty', { courseName })}
        </p>
      )}
    </Panel>
  );
};

export default CourseRecordBook;
