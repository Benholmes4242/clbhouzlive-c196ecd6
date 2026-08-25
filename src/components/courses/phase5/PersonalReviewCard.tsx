/**
 * PersonalReviewCard - "Your rating" in the analytical treatment.
 *
 * BRIEF_COURSE_YOU_TAB_TREATMENT s3: the comparison pill becomes a third stat
 * cell (three-state logic and the 0.2 threshold preserved exactly), the header
 * drops the Calendar icon, the panel drops its shadow, and Read more / Edit
 * become the shared Action treatment.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { useNavigate } from 'react-router-dom';
import { formatMonthDayYearShort } from '@/i18n/format';
import {
  SubScoreBar, bandColorOnDark, BAND_GREEN_DARK, BAND_RED_DARK,
} from '@/features/courses/_shared/scoreBands';
import { MentionText } from '@/components/mentions/MentionText';
import { stripMentionMarkup } from '@/lib/mentions/format';
import {
  A, Panel, StatRow, Action, SANS, type StatItem,
} from '@/features/courses/components/holes/analytical/tokens';

/**
 * Dark-canvas score inks (BRIEF_ONE_GREEN). The local '#0F8F4A' / '#C8372B'
 * pair was a second byte-identical copy of an ink tuned for white; scoreBands
 * documents that failure and supplies the dark variants.
 */
const UNDER = BAND_GREEN_DARK;
const OVER = BAND_RED_DARK;

interface PersonalReviewCardProps {
  courseId: string;
  rating: UserCourseRating;
  communityAverage?: number | null;
  className?: string;
}

export const PersonalReviewCard: React.FC<PersonalReviewCardProps> = ({
  courseId,
  rating,
  communityAverage,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const [expanded, setExpanded] = useState(false);

  const handleEditClick = () => navigate(`/courses/${courseId}/rate`);

  const dateValue = rating.updated_at || rating.created_at;
  const dateLabel = formatMonthDayYearShort(new Date(dateValue));

  const categories = [
    { key: 'design', labelKey: 'review.subscore.design', score: rating.design_score },
    { key: 'condition', labelKey: 'review.subscore.condition', score: rating.condition_score },
    { key: 'clubhouse', labelKey: 'review.subscore.clubhouse', score: rating.clubhouse_score },
    { key: 'facilities', labelKey: 'review.subscore.facilities', score: rating.facilities_score },
  ].filter(
    (c): c is { key: string; labelKey: string; score: number } => c.score !== null,
  );

  const hasCommunity = communityAverage != null && communityAverage > 0;

  // Three-state comparison, unchanged: |diff| < 0.2 reads level, not "+0.1".
  const items: StatItem[] = [
    { label: t('courseDetail.you.yours'), value: rating.rating.toFixed(1), tone: bandColorOnDark(rating.rating) },
  ];
  if (hasCommunity) {
    const avg = communityAverage as number;
    items.push({
      label: t('courseDetail.you.community'),
      value: avg.toFixed(1),
      tone: bandColorOnDark(avg),
    });
    const diff = Number((rating.rating - avg).toFixed(1));
    const absDiff = Math.abs(diff);
    items.push({
      label: t('courseDetail.you.difference'),
      value:
        absDiff < 0.2
          ? t('courseDetail.you.level')
          : `${diff > 0 ? '+' : '\u2212'}${absDiff.toFixed(1)}`,
      tone: absDiff < 0.2 ? A.INK : diff > 0 ? UNDER : OVER,
    });
  }

  const review = rating.review;
  const needsClamp = !!review && stripMentionMarkup(review).length > 180;

  return (
    <Panel
      title={t('courseDetail.you.yourRating')}
      aside={t('phase5.personalReview.reviewedOn', { date: dateLabel })}
    >
      <StatRow items={items} style={{ marginBottom: categories.length > 0 ? 20 : 0 }} />

      {categories.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            columnGap: 18,
            rowGap: 10,
          }}
        >
          {categories.map((cat) => (
            <SubScoreBar key={cat.key} label={t(cat.labelKey)} score={cat.score} />
          ))}
        </div>
      )}

      {review && (
        <>
          <p
            style={{
              margin: '16px 0 0',
              fontSize: 13.5,
              lineHeight: 1.55,
              color: A.MUTE,
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
              fontFamily: SANS,
              display: !expanded && needsClamp ? '-webkit-box' : 'block',
              WebkitLineClamp: !expanded && needsClamp ? 3 : 'unset',
              WebkitBoxOrient: 'vertical',
              overflow: !expanded && needsClamp ? 'hidden' : 'visible',
            }}
          >
            {'"'}
            <MentionText as="span" text={review} />
            {'"'}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: needsClamp ? 'space-between' : 'flex-end',
            }}
          >
            {needsClamp && (
              <Action
                label={expanded ? t('courseDetail.you.showLess') : t('courseDetail.you.readMore')}
                align="left"
                onClick={() => setExpanded((v) => !v)}
              />
            )}
            <Action label={t('courseDetail.you.editRating')} onClick={handleEditClick} />
          </div>
        </>
      )}

      {!review && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Action label={t('courseDetail.you.editRating')} onClick={handleEditClick} />
        </div>
      )}
    </Panel>
  );
};

export default PersonalReviewCard;
