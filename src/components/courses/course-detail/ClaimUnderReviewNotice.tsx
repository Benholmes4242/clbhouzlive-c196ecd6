import React from 'react';
import { useTranslation } from 'react-i18next';
import { INK, INK_FAINT } from '@/features/courses/_shared/tokens';

const ClaimUnderReviewNotice: React.FC = () => {
  const { t } = useTranslation('courses');
  return (
    <div style={{ padding: '8px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>
        {t('courseDetail.claim.underReview.title')}
      </div>
      <p style={{ fontSize: 12, color: INK_FAINT, margin: '0 auto', maxWidth: 280, lineHeight: 1.5 }}>
        {t('courseDetail.claim.underReview.body')}
      </p>
    </div>
  );
};

export default ClaimUnderReviewNotice;
