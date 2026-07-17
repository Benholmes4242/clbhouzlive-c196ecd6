import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';

const ClaimUnderReviewNotice: React.FC = () => {
  const { t } = useTranslation('courses');
  return (
    <div style={{ padding: '8px 16px', textAlign: 'center' }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(247,147,30,0.12)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Clock size={20} strokeWidth={2} color={AMBER} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 4 }}>
        {t('courseDetail.claim.underReview.title')}
      </div>
      <p style={{ fontSize: 12, color: INK_FAINT, margin: '0 auto', maxWidth: 280, lineHeight: 1.5 }}>
        {t('courseDetail.claim.underReview.body')}
      </p>
    </div>
  );
};

export default ClaimUnderReviewNotice;
