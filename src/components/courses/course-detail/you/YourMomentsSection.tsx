/**
 * BRIEF_YOU_TAB_REBUILD §3.7 — YOUR MOMENTS.
 *
 * Behaviour unchanged from the Panel version: the same viewer-scoped read and
 * the same read-only fullscreen viewer. Three tiles, equal width, 84px, radius
 * 12, 8px gap; absent at zero. CourseMoments.tsx is untouched.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { useUserCourseMoments } from '@/hooks/useUserCourseMoments';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import AboutSection from '../about/AboutSection';
import { MomentMediaStrip } from '../AboutMediaStrip';

interface Props {
  courseId: string;
  courseName: string;
  onOpen?: (momentId: string) => void;
}

const YourMomentsSection: React.FC<Props> = ({ courseId, courseName, onOpen }) => {
  const { t } = useTranslation('courses');
  const { data: moments } = useUserCourseMoments(courseId);
  const { user } = useSupabaseSession();
  const { profile } = useProfileData();

  /* Viewer-scoped read, so author === viewer; the viewer opens read-only and no
     engagement mutation can fire against these stub values (ported rule). */
  const posts = React.useMemo<FeedPost[]>(
    () =>
      (moments ?? []).map((m) => ({
        id: m.id,
        userId: user?.id ?? '',
        actorType: 'personal',
        actorId: user?.id ?? '',
        username: profile?.username ?? '',
        displayName: profile?.display_name ?? profile?.username ?? '',
        avatarUrl: profile?.profile_photo_url ?? '',
        isVerified: profile?.is_verified ?? false,
        creatorRelation: 'none',
        caption: m.caption ?? '',
        mediaItems: [
          {
            id: m.id,
            type: m.mediaType,
            hlsUrl: m.mediaType === 'video' ? m.mediaUrl : undefined,
            imageUrl: m.mediaType === 'image' ? m.mediaUrl : undefined,
            thumbnailUrl: m.posterUrl,
            width: 0,
            height: 0,
          },
        ],
        createdAt: m.createdAt,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: false,
        isFollowedByMe: false,
        courseName,
        courseId,
      }) as FeedPost),
    [moments, user?.id, profile, courseName, courseId],
  );

  if (!moments || moments.length === 0) return null;

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
          if (posts.length > 0) useFullscreenFeedStore.getState().open(posts, index, { readOnly: true });
        }}
      />
    </AboutSection>
  );
};

export default YourMomentsSection;
