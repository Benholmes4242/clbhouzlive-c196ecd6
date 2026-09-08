/**
 * BRIEF_YOU_TAB_REBUILD §3.6 — YOUR RATING.
 *
 * Your score is the META. The community score, the difference figure and the
 * four category bars are NOT here: the community score lives on the Course tab
 * and the categories moved to Reviews. A comparison belongs on the section
 * about the community, not the one about you. PersonalReviewCard.tsx is
 * untouched — this tab simply stops calling it.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { UserCourseRating } from '@/hooks/useUserCourseRating';
import { MentionText } from '@/components/mentions/MentionText';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from '../about/AboutSection';
import { YouLinkRow, YouSentence } from './youBits';

interface Props {
  rating: UserCourseRating | null;
  onEdit: () => void;
  onRate: () => void;
}

const YourRatingSection: React.FC<Props> = ({ rating, onEdit, onRate }) => {
  const { t } = useTranslation('courses');
  const heading = t('courseDetail.youTab.sections.rating');

  if (!rating) {
    return (
      <AboutSection heading={heading}>
        <YouSentence quiet>{t('courseDetail.youTab.rating.notRated')}</YouSentence>
        <YouLinkRow label={t('courseDetail.youTab.rating.rateIt')} hairline={false} onPress={onRate} />
      </AboutSection>
    );
  }

  return (
    <AboutSection heading={heading} meta={rating.rating.toFixed(1)}>
      {rating.review ? (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: A.MUTE,
            fontStyle: 'italic',
            whiteSpace: 'pre-wrap',
            fontFamily: SANS,
          }}
        >
          {'"'}
          <MentionText as="span" text={rating.review} />
          {'"'}
        </p>
      ) : null}
      <YouLinkRow
        label={t('courseDetail.you.editRating')}
        hairline={Boolean(rating.review)}
        onPress={onEdit}
      />
    </AboutSection>
  );
};

export default YourRatingSection;
