import React from 'react';
import { Clock } from 'lucide-react';
import { AMBER, INK, INK_FAINT } from '@/features/courses/_shared/tokens';

const ClaimUnderReviewNotice: React.FC = () => {
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
        Claim under review
      </div>
      <p style={{ fontSize: 12, color: INK_FAINT, margin: '0 auto', maxWidth: 280, lineHeight: 1.5 }}>
        A business has requested to manage this course. Verification is in progress.
      </p>
    </div>
  );
};

export default ClaimUnderReviewNotice;
