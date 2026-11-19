/**
 * BRIEF_YOU_TAB_REBUILD §3.7 — YOUR MOMENTS.
 *
 * Viewer-scoped tiles open canonical review pages shared with CourseMoments
 * and CourseYouTab; tapped media identity is independent of grouped page index.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { momentPages, momentPageIndex } from '@/lib/reviews/momentPages';
import type { FeedPost } from '@/components/media-system/types/media';
import AboutSection from '../about/AboutSection';
import { MomentMediaStrip } from '../AboutMediaStrip';

interface Props {
  courseId: string;
  courseName: string;
  onOpen?: (momentId: string) => void;
}

export function useMomentPosts(courseId: string, courseName: string) {
  const { data: moments } = useUserCourseMoments(courseId);
  const { user } = useSupabaseSession();
  const { profile } = useProfileData();

  const posts = React.useMemo<FeedPost[]>(() => momentPages(moments ?? [], {
    userId: user?.id ?? '', username: profile?.username,
    displayName: profile?.display_name ?? profile?.username,
    avatarUrl: profile?.profile_photo_url,
  }, courseId, courseName), [moments, user?.id, profile, courseId, courseName]);
  const openMoment = React.useCallback((index: number) => {
    const moment = moments?.[index];
    if (!moment) return;
    const page = momentPageIndex(posts, moment.id);
    if (page >= 0) useFullscreenFeedStore.getState().open(posts, page, { mediaId: moment.id });
  }, [moments, posts]);

  return { moments: moments ?? [], posts, openMoment };
}

const YourMomentsSection: React.FC<Props> = ({ courseId, courseName, onOpen }) => {
  const { t } = useTranslation('courses');
  const { moments, openMoment } = useMomentPosts(courseId, courseName);
  if (moments.length === 0) return null;

  return (
    <AboutSection
      heading={t('courseDetail.you.moments')}
      meta={t('courseDetail.youTab.momentsMeta', {
        count: moments.length,
        moments: formatNumber(moments.length),
      })}
    >
      <MomentMediaStrip
        items={moments}
        onOpen={(index) => {
          const moment = moments[index];
          if (moment) onOpen?.(moment.id);
          openMoment(index);
        }}
      />
    </AboutSection>
  );
};

export default YourMomentsSection;
