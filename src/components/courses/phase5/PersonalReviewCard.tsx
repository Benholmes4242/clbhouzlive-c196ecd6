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
  SubScoreBar,
} from '@/features/courses/_shared/scoreBands';
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';
import { MentionText } from '@/components/mentions/MentionText';
import { stripMentionMarkup } from '@/lib/mentions/format';
import {
  A, Panel, StatRow, Action, SANS, courseSubScoreTone, type StatItem,
} from '@/features/courses/components/holes/analytical/tokens';

/**
 * Rating comparisons use white ink, not handicap or to-par movement colours.
 */
const UNDER = A.INK;
const OVER = A.INK;

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

  const hasCommunity = communityAverage != null && communityAverage > 0;

  // Three-state comparison, unchanged: |diff| < 0.2 reads level, not "+0.1".
  // The member's own overall now lives in ReviewScoreRow; the strip keeps the comparisons.
  const items: StatItem[] = [];
  if (hasCommunity) {
    const avg = communityAverage as number;
    items.push({
      label: t('courseDetail.you.community'),
      value: avg.toFixed(1),
      tone: courseSubScoreTone(avg),
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
      {/* The shared review score row (signed-off mock): overall plus categories. */}
      <ReviewScoreRow
        overall={rating.rating ?? null}
        breakdown={{
          design: rating.design_score ?? null,
          condition: rating.condition_score ?? null,
          clubhouse: rating.clubhouse_score ?? null,
          facilities: rating.facilities_score ?? null,
        }}
      />
      {items.length > 0 && <StatRow items={items} style={{ marginTop: 20 }} />}

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
