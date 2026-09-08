/**
 * BRIEF_COURSE_TAB_REBUILD §3.8 — PHOTOS, flat.
 *
 * The mosaic is UNCHANGED: AboutMediaStrip still builds the tiles, the grouped
 * FeedPosts and the read-only fullscreen open. Only the heading changed — it was
 * a hardcoded English "MEDIA" kicker with a hardcoded "3 photos · 1 video"
 * aside, and it is now the shared section heading with localised, sentence-case
 * mute meta on the same baseline as every other section on the tab.
 *
 * The counts are read here rather than reported upward from the strip: it is the
 * same useClubMedia query at the same limit, so react-query serves both from one
 * cache entry and no second request is made.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useCourseMediaCounts } from '@/hooks/useCourseMediaCounts';
import AboutMediaStrip from '../AboutMediaStrip';
import AboutSection from './AboutSection';

interface PhotosProps {
  courseId: string;
  onSeeAll: () => void;
}

const Photos: React.FC<PhotosProps> = ({ courseId, onSeeAll }) => {
  const { t } = useTranslation('courses');
  /* ONE COUNT, SERVER-SIDE (§1). This used to take the LENGTH of the strip's
     capped 30-row fetch, which counted review photographs a second time when
     they had also been posted and truncated whatever was past 30 — "26 photos"
     against the Media tab's honest 21 on Sundridge East. Both surfaces now read
     get_course_media_counts, and share its cache entry. */
  const { data: counts, isLoading } = useCourseMediaCounts(courseId);
  const photos = counts?.photos ?? 0;
  const videos = counts?.videos ?? 0;

  /* No count while the read is in flight, and no video half when there are
     none — "3 photos · 0 videos" states an absence nobody asked about. */
  const meta = isLoading
    ? null
    : [
        t('courseDetail.mediaStrip.photoCount', { count: photos }),
        videos > 0 ? t('courseDetail.mediaStrip.videoCount', { count: videos }) : null,
      ]
        .filter(Boolean)
        .join(' \u00B7 ');

  return (
    <AboutSection heading={t('courseDetail.sections.photos')} meta={meta} bleed>
      <AboutMediaStrip clubId={courseId} onSeeAllClick={onSeeAll} headerless gutter={20} />
    </AboutSection>
  );
};

export default Photos;
